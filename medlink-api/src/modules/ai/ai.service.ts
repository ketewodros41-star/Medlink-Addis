import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>("GEMINI_API_KEY") || "AIzaSyBZomrFCxL1XLAzRUnL8kmLo6q-SrsMO0s";
  }

  private async callGemini(prompt: string): Promise<string> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Gemini API returned error: ${response.status} - ${errText}`);
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Invalid response format from Gemini API");

      return text;
    } catch (err: any) {
      this.logger.error("Failed calling Gemini API", err);
      throw new InternalServerErrorException(err.message || "Failed calling Gemini service");
    }
  }

  async generateSoapDraft(complaint: string, transcript: string): Promise<any> {
    const prompt = `
You are an expert AI clinical scribe. Analyze the clinical intake and patient conversation transcript, and draft a structured clinical SOAP note.
Chief Complaint: "${complaint}"
Conversation Transcript:
"${transcript}"

Format your response strictly as a JSON object containing the following keys:
- "subjective": Summarize patient-reported symptoms, pain, history of present illness.
- "objective": Detail physical exam observations, vital signs mentioned, or visual findings.
- "assessment": Clinical diagnostic impressions and reasoning.
- "plan": Step-by-step treatment plan, prescriptions, lab orders, or follow-ups.

Do not include any markdown fences or surrounding text, return only raw JSON.
`;
    const responseText = await this.callGemini(prompt);
    return JSON.parse(responseText);
  }

  async explainPrescription(drugName: string, sig: string): Promise<any> {
    const prompt = `
You are a senior clinical pharmacist. Explain the following prescription to a patient in clear, supportive, and patient-friendly terms.
Drug: "${drugName}"
Directions: "${sig}"

Format your response strictly as a JSON object with keys:
- "purpose": What is this drug for.
- "directions": How to take it simply.
- "sideEffects": Key side effects to watch out for.
- "warnings": Dangerous interactions or when to call the doctor.

Do not include markdown fences, return only raw JSON.
`;
    const responseText = await this.callGemini(prompt);
    return JSON.parse(responseText);
  }

  async interpretLabResult(testName: string, resultText: string): Promise<any> {
    const prompt = `
You are a senior pathologist. Interpret this laboratory result and note any clinical significance or alert conditions.
Test: "${testName}"
Result Values: "${resultText}"

Format your response strictly as a JSON object with keys:
- "interpretation": Summary of what these results mean.
- "clinicalSignificance": Normal, High, Low, or Critical assessment.
- "recommendations": Immediate next steps or red flags.

Do not include markdown fences, return only raw JSON.
`;
    const responseText = await this.callGemini(prompt);
    return JSON.parse(responseText);
  }

  async checkDrugInteractions(drugs: string[]): Promise<any> {
    const prompt = `
You are a clinical pharmacologist. Check if there are any moderate or severe drug-drug interactions between these medications:
Medications: ${JSON.stringify(drugs)}

Format your response strictly as a JSON object with keys:
- "hasInteraction": boolean
- "severity": "None" | "Mild" | "Moderate" | "Severe"
- "details": Description of the interaction mechanism and risk.

Do not include markdown fences, return only raw JSON.
`;
    const responseText = await this.callGemini(prompt);
    return JSON.parse(responseText);
  }
}
