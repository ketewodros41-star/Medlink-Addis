export type CalculatorInput = {
  key: string;
  label: string;
  type: "boolean" | "number" | "select";
  options?: Array<{ label: string; value: string | number }>;
};

export type CalculatorDefinition = {
  id: string;
  name: string;
  specialty: string;
  description: string;
  inputs: CalculatorInput[];
  references: string[];
  calculate: (inputs: Record<string, number | boolean | string>) => {
    score: number;
    category: string;
    interpretation: string;
  };
};

const bool = (value: unknown) => value === true || value === "true" || value === 1;
const num = (value: unknown) => Number(value ?? 0);

export const clinicalCalculators: CalculatorDefinition[] = [
  {
    id: "curb-65",
    name: "CURB-65",
    specialty: "Respiratory",
    description: "Community-acquired pneumonia mortality risk stratification.",
    references: ["Lim WS et al. Thorax. 2003;58:377-382."],
    inputs: [
      { key: "confusion", label: "New confusion", type: "boolean" },
      { key: "ureaHigh", label: "Urea > 7 mmol/L or BUN > 19 mg/dL", type: "boolean" },
      { key: "respiratoryRateHigh", label: "Respiratory rate >= 30/min", type: "boolean" },
      { key: "lowBloodPressure", label: "SBP < 90 or DBP <= 60", type: "boolean" },
      { key: "age65", label: "Age >= 65 years", type: "boolean" },
    ],
    calculate: (inputs) => {
      const score = ["confusion", "ureaHigh", "respiratoryRateHigh", "lowBloodPressure", "age65"].filter((key) =>
        bool(inputs[key]),
      ).length;
      const category = score <= 1 ? "Low" : score === 2 ? "Moderate" : "High";
      return {
        score,
        category,
        interpretation:
          score <= 1
            ? "Usually suitable for outpatient treatment if clinically stable."
            : score === 2
              ? "Consider short inpatient observation or supervised treatment."
              : "High risk. Urgent inpatient care and possible ICU assessment are recommended.",
      };
    },
  },
  {
    id: "wells-dvt",
    name: "Wells Score for DVT",
    specialty: "Emergency Medicine",
    description: "Pre-test probability estimate for deep vein thrombosis.",
    references: ["Wells PS et al. Lancet. 1997;350:1795-1798."],
    inputs: [
      { key: "activeCancer", label: "Active cancer", type: "boolean" },
      { key: "paralysis", label: "Paralysis, paresis, or recent leg immobilization", type: "boolean" },
      { key: "bedridden", label: "Recently bedridden > 3 days or major surgery", type: "boolean" },
      { key: "tenderness", label: "Localized tenderness along deep venous system", type: "boolean" },
      { key: "entireLegSwollen", label: "Entire leg swollen", type: "boolean" },
      { key: "calfSwelling", label: "Calf swelling > 3 cm", type: "boolean" },
      { key: "pittingEdema", label: "Pitting edema confined to symptomatic leg", type: "boolean" },
      { key: "collateralVeins", label: "Collateral superficial veins", type: "boolean" },
      { key: "previousDvt", label: "Previous DVT", type: "boolean" },
      { key: "alternativeDiagnosis", label: "Alternative diagnosis at least as likely", type: "boolean" },
    ],
    calculate: (inputs) => {
      const positives = [
        "activeCancer",
        "paralysis",
        "bedridden",
        "tenderness",
        "entireLegSwollen",
        "calfSwelling",
        "pittingEdema",
        "collateralVeins",
        "previousDvt",
      ].filter((key) => bool(inputs[key])).length;
      const score = positives - (bool(inputs.alternativeDiagnosis) ? 2 : 0);
      return {
        score,
        category: score >= 2 ? "DVT likely" : "DVT unlikely",
        interpretation: score >= 2 ? "Proceed with diagnostic imaging pathway." : "Consider D-dimer based rule-out pathway.",
      };
    },
  },
  {
    id: "gcs",
    name: "Glasgow Coma Scale",
    specialty: "Emergency Medicine",
    description: "Neurologic consciousness score from eye, verbal, and motor response.",
    references: ["Teasdale G, Jennett B. Lancet. 1974;304:81-84."],
    inputs: [
      { key: "eye", label: "Eye response", type: "number" },
      { key: "verbal", label: "Verbal response", type: "number" },
      { key: "motor", label: "Motor response", type: "number" },
    ],
    calculate: (inputs) => {
      const score = Math.max(1, Math.min(4, num(inputs.eye))) + Math.max(1, Math.min(5, num(inputs.verbal))) + Math.max(1, Math.min(6, num(inputs.motor)));
      return {
        score,
        category: score <= 8 ? "Severe" : score <= 12 ? "Moderate" : "Mild",
        interpretation: score <= 8 ? "Severe impairment; airway and urgent escalation should be considered." : "Document trend and reassess regularly.",
      };
    },
  },
  {
    id: "apgar",
    name: "APGAR Score",
    specialty: "Obstetrics & Gynecology",
    description: "Newborn status score at 1 and 5 minutes.",
    references: ["Apgar V. Curr Res Anesth Analg. 1953;32:260-267."],
    inputs: [
      { key: "appearance", label: "Appearance", type: "number" },
      { key: "pulse", label: "Pulse", type: "number" },
      { key: "grimace", label: "Grimace", type: "number" },
      { key: "activity", label: "Activity", type: "number" },
      { key: "respiration", label: "Respiration", type: "number" },
    ],
    calculate: (inputs) => {
      const score = ["appearance", "pulse", "grimace", "activity", "respiration"].reduce((sum, key) => sum + Math.max(0, Math.min(2, num(inputs[key]))), 0);
      return {
        score,
        category: score >= 7 ? "Reassuring" : score >= 4 ? "Moderately abnormal" : "Low",
        interpretation: score >= 7 ? "Routine observation if the newborn is otherwise stable." : "Needs active reassessment and neonatal support pathway.",
      };
    },
  },
  {
    id: "bmi",
    name: "BMI",
    specialty: "General Medicine",
    description: "Body mass index from weight and height.",
    references: ["World Health Organization BMI classification."],
    inputs: [
      { key: "weightKg", label: "Weight (kg)", type: "number" },
      { key: "heightCm", label: "Height (cm)", type: "number" },
    ],
    calculate: (inputs) => {
      const heightM = num(inputs.heightCm) / 100;
      const score = heightM > 0 ? Number((num(inputs.weightKg) / (heightM * heightM)).toFixed(1)) : 0;
      const category = score < 18.5 ? "Underweight" : score < 25 ? "Normal" : score < 30 ? "Overweight" : "Obesity";
      return { score, category, interpretation: "Use BMI with clinical context, edema status, pregnancy, and body composition." };
    },
  },
  {
    id: "qsofa",
    name: "qSOFA",
    specialty: "Emergency Medicine",
    description: "Sepsis-associated poor outcome screen.",
    references: ["Singer M et al. JAMA. 2016;315:801-810."],
    inputs: [
      { key: "respiratoryRateHigh", label: "Respiratory rate >= 22/min", type: "boolean" },
      { key: "alteredMentation", label: "Altered mentation", type: "boolean" },
      { key: "systolicBpLow", label: "Systolic BP <= 100 mmHg", type: "boolean" },
    ],
    calculate: (inputs) => {
      const score = ["respiratoryRateHigh", "alteredMentation", "systolicBpLow"].filter((key) => bool(inputs[key])).length;
      return {
        score,
        category: score >= 2 ? "High risk" : "Lower risk",
        interpretation: score >= 2 ? "Prompt sepsis assessment, labs, antibiotics, and escalation should be considered." : "Continue clinical assessment; qSOFA is not a rule-out test.",
      };
    },
  },
];
