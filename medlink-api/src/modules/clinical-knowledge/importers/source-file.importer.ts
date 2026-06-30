import { BadRequestException, Injectable } from "@nestjs/common";
import { XMLParser } from "fast-xml-parser";
import { parse as parseCsvSync } from "csv-parse/sync";
import { ClinicalContentImporter } from "./clinical-content.importer";
import { ImportSourceFileDto } from "../dto/import-source-file.dto";

type NormalizedRecord = Record<string, unknown>;

const asArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const compact = (items: Array<string | null | undefined>) =>
  items.map((item) => item?.trim()).filter((item): item is string => Boolean(item));

@Injectable()
export class SourceFileImporter {
  constructor(private readonly importer: ClinicalContentImporter) {}

  async import(dto: ImportSourceFileDto, actorId: string) {
    const records = this.parse(dto);
    const dataset = this.datasetFor(dto.sourceType);
    return this.importer.import(
      {
        dataset,
        version: dto.version,
        source: {
          name: dto.sourceName,
          url: dto.sourceUrl,
          publishedAt: dto.publishedAt,
        },
        records,
      },
      actorId,
    );
  }

  private parse(dto: ImportSourceFileDto): NormalizedRecord[] {
    switch (dto.sourceType) {
      case "cdc-icd10-cm":
        return this.parseCdcIcd10Xml(dto.content);
      case "rxnorm-prescribable":
        return this.parseRxNormRrf(dto.content);
      case "loinc":
        return this.parseLoincCsv(dto.content);
      case "medlineplus":
        return this.parseMedlinePlusXml(dto.content);
      default:
        throw new BadRequestException("Unsupported source type");
    }
  }

  private datasetFor(sourceType: ImportSourceFileDto["sourceType"]) {
    if (sourceType === "cdc-icd10-cm") return "diseases" as const;
    if (sourceType === "rxnorm-prescribable") return "medications" as const;
    if (sourceType === "loinc") return "labs" as const;
    if (sourceType === "medlineplus") return "diseases" as const;
    throw new BadRequestException("Unsupported source type");
  }

  private parseCdcIcd10Xml(content: string): NormalizedRecord[] {
    const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
    const doc = parser.parse(content);
    const chapters = asArray(doc?.ICD10CM.tabular.chapter);
    const records: NormalizedRecord[] = [];

    const visitDiag = (diag: any, inheritedBodySystem: string) => {
      const code = diag?.name ? String(diag.name).replace(".", "") : null;
      const displayCode = diag?.name ? String(diag.name) : null;
      const name = diag?.desc ? String(diag.desc) : null;
      if (displayCode && name) {
        records.push({
          icd10Code: displayCode,
          name,
          bodySystem: inheritedBodySystem,
          description: name,
          alternativeNames: compact([code && code !== displayCode ? code : null]),
          references: [{ title: "CDC/NCHS ICD-10-CM Tabular List", source: "CDC/NCHS" }],
        });
      }
      for (const child of asArray(diag?.diag)) visitDiag(child, inheritedBodySystem);
    };

    for (const chapter of chapters) {
      const bodySystem = String(chapter.desc ?? "General Medicine").replace(/\s+/g, " ").trim();
      for (const section of asArray(chapter.section)) {
        for (const diag of asArray(section.diag)) visitDiag(diag, bodySystem);
      }
      for (const diag of asArray(chapter.diag)) visitDiag(diag, bodySystem);
    }

    if (!records.length) throw new BadRequestException("No ICD-10-CM diagnosis records found in XML content");
    return records;
  }

  private parseRxNormRrf(content: string): NormalizedRecord[] {
    const rows = parseCsvSync(content, {
      delimiter: "|",
      relax_column_count: true,
      skip_empty_lines: true,
    }) as string[][];

    const byRxCui = new Map<string, { genericName?: string; brandNames: Set<string>; forms: Set<string> }>();
    for (const row of rows) {
      const rxcui = row[0];
      const tty = row[12];
      const name = row[14];
      const suppress = row[16];
      if (!rxcui || !name || suppress === "O") continue;
      const entry = byRxCui.get(rxcui) ?? { brandNames: new Set<string>(), forms: new Set<string>() };
      if (["IN", "PIN", "MIN"].includes(tty)) entry.genericName = name;
      if (["BN", "SBD", "BPCK"].includes(tty)) entry.brandNames.add(name);
      if (["SCD", "SBD", "GPCK", "BPCK"].includes(tty)) entry.forms.add(name);
      byRxCui.set(rxcui, entry);
    }

    const records = Array.from(byRxCui.entries())
      .filter(([, value]) => value.genericName)
      .map(([rxcui, value]) => ({
        genericName: value.genericName,
        brandNames: Array.from(value.brandNames).slice(0, 20),
        drugClass: "RxNorm Prescribable",
        therapeuticCategory: "Medication",
        dosageForms: Array.from(value.forms).slice(0, 20),
        references: [{ title: `RxNorm RxCUI ${rxcui}`, source: "NIH/NLM RxNorm" }],
      }));

    if (!records.length) throw new BadRequestException("No RxNorm prescribable records found. Expected RXNCONSO.RRF content.");
    return records;
  }

  private parseLoincCsv(content: string): NormalizedRecord[] {
    const rows = parseCsvSync(content, {
      columns: true,
      bom: true,
      skip_empty_lines: true,
      relax_quotes: true,
    }) as Record<string, string>[];

    const records = rows
      .filter((row) => row.LOINC_NUM && row.COMPONENT)
      .map((row) => ({
        testName: row.LONG_COMMON_NAME || row.COMPONENT,
        alternativeNames: compact([row.SHORTNAME, row.COMPONENT, row.LOINC_NUM]),
        description: row.RELATEDNAMES2 || row.DEFINITIONDESCRIPTION || row.LONG_COMMON_NAME,
        specimenType: row.SYSTEM,
        normalReferenceRange: row.EXAMPLE_UCUM_UNITS ? `Uses UCUM unit ${row.EXAMPLE_UCUM_UNITS}` : null,
        units: row.EXAMPLE_UCUM_UNITS || null,
        clinicalInterpretation: compact([row.CLASSTYPE && `Class type: ${row.CLASSTYPE}`, row.STATUS && `Status: ${row.STATUS}`]).join(". "),
        relatedDiseases: [],
      }));

    if (!records.length) throw new BadRequestException("No LOINC records found. Expected Loinc.csv content.");
    return records;
  }

  private parseMedlinePlusXml(content: string): NormalizedRecord[] {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", trimValues: true });
    const doc = parser.parse(content);
    const topics = asArray(doc?.["health-topics"]?.["health-topic"]);
    const records = topics
      .filter((topic: any) => topic?.title)
      .map((topic: any) => {
        const mesh = asArray(topic.mesh?.descriptor).map((item: any) => String(item?.["#text"] ?? item)).filter(Boolean);
        const alsoCalled = asArray(topic["also-called"]).map(String);
        const groups = asArray(topic.group).map((item: any) => String(item?.["#text"] ?? item)).filter(Boolean);
        return {
          icd10Code: `MEDLINEPLUS-${topic.id}`,
          name: String(topic.title),
          alternativeNames: alsoCalled,
          bodySystem: groups[0] ?? "General Medicine",
          description: String(topic.fullSummary ?? topic.metaDesc ?? ""),
          patientEducation: String(topic.fullSummary ?? ""),
          references: [
            {
              title: String(topic.title),
              url: String(topic.url ?? ""),
              source: "NIH/NLM MedlinePlus",
            },
          ],
          evidenceLevel: "consumer-health-reviewed",
          symptoms: mesh,
        };
      });

    if (!records.length) throw new BadRequestException("No MedlinePlus health topic records found in XML content");
    return records;
  }
}
