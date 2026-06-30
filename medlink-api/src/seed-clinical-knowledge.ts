import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { KnowledgeDisease } from "./modules/clinical-knowledge/entities/knowledge-disease.entity";
import { KnowledgeMedication } from "./modules/clinical-knowledge/entities/knowledge-medication.entity";
import { KnowledgeLabTest } from "./modules/clinical-knowledge/entities/knowledge-lab-test.entity";
import { KnowledgeGuideline } from "./modules/clinical-knowledge/entities/knowledge-guideline.entity";

dotenv.config();

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "aws-0-eu-west-1.pooler.supabase.com",
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || "postgres",
  ssl: { rejectUnauthorized: false },
  entities: [KnowledgeDisease, KnowledgeMedication, KnowledgeLabTest, KnowledgeGuideline],
  synchronize: false,
});


async function main() {
  console.log("Connecting to database...");
  await AppDataSource.initialize();
  console.log("Connected successfully!");

  // 1. Seed Lab Tests
  const labRepo = AppDataSource.getRepository(KnowledgeLabTest);
  console.log("Seeding Lab Tests...");
  const labData = [
    {
      testName: "Troponin I/T",
      alternativeNames: ["Cardiac Troponin", "cTnI", "cTnT"],
      description: "Highly specific marker for myocardial cell injury (cardiac necrosis). Used to diagnose acute coronary syndrome.",
      specimenType: "Blood (Serum/Plasma)",
      preparation: "No special preparation required.",
      normalReferenceRange: "< 0.04 ng/mL (High-sensitivity assay ranges vary)",
      units: "ng/mL",
      clinicalInterpretation: "Elevated levels indicate myocardial necrosis. Key diagnostic pillar for Myocardial Infarction.",
      relatedDiseases: ["Myocardial Infarction"],
      datasetVersion: "starter-2026.06",
    },
    {
      testName: "Complete Blood Count (CBC)",
      alternativeNames: ["FBC", "Full Blood Count"],
      description: "Evaluates cellular components of blood: red cells, white cells, platelets, hemoglobin, hematocrit.",
      specimenType: "Whole Blood (EDTA)",
      preparation: "No fasting required.",
      normalReferenceRange: "WBC: 4.5-11.0 x10^9/L, Hemoglobin: 12-16 g/dL (F), 13.5-17.5 g/dL (M)",
      units: "g/dL",
      clinicalInterpretation: "High WBC indicates infection or inflammation. Low Hemoglobin indicates anemia.",
      relatedDiseases: ["Pneumonia", "Malaria", "Typhoid Fever", "Sepsis"],
      datasetVersion: "starter-2026.06",
    },
    {
      testName: "D-Dimer",
      alternativeNames: ["Fibrin degradation product"],
      description: "Measures fibrin degradation products. Used to help rule out active thrombosis (DVT/PE).",
      specimenType: "Blood (Plasma)",
      preparation: "None required.",
      normalReferenceRange: "< 500 ng/mL or < 0.50 mg/L FEU",
      units: "ng/mL",
      clinicalInterpretation: "Normal levels have a high negative predictive value for ruling out PE or DVT. Elevated in thrombotic conditions, inflammation, pregnancy.",
      relatedDiseases: ["Pulmonary Embolism", "Deep Vein Thrombosis"],
      datasetVersion: "starter-2026.06",
    },
    {
      testName: "HbA1c",
      alternativeNames: ["Glycated Hemoglobin", "A1c"],
      description: "Provides an average of blood glucose control over the past 2-3 months.",
      specimenType: "Blood (Whole Blood)",
      preparation: "No fasting required.",
      normalReferenceRange: "Normal: < 5.7%, Prediabetes: 5.7-6.4%, Diabetes: >= 6.5%",
      units: "%",
      clinicalInterpretation: "Elevated levels indicate chronic hyperglycemia and diagnose or monitor Diabetes.",
      relatedDiseases: ["Diabetes Mellitus Type 2"],
      datasetVersion: "starter-2026.06",
    },
    {
      testName: "Widal Test",
      alternativeNames: ["Typhoid Antibody Test"],
      description: "Agglutination test to measure antibodies against Salmonella enterica serovar Typhi antigens (O and H).",
      specimenType: "Blood (Serum)",
      preparation: "None.",
      normalReferenceRange: "Titer < 1:80 for O and H antibodies",
      units: "Titer",
      clinicalInterpretation: "High titers (>= 1:160) or rising titers suggest active Salmonella Typhi infection. Low specificity in endemic zones.",
      relatedDiseases: ["Typhoid Fever"],
      datasetVersion: "starter-2026.06",
    }
  ];

  for (const item of labData) {
    const existing = await labRepo.findOne({ where: { testName: item.testName } });
    if (existing) {
      Object.assign(existing, item);
      await labRepo.save(existing);
    } else {
      await labRepo.save(labRepo.create(item));
    }
  }

  // 2. Seed Medications
  const medRepo = AppDataSource.getRepository(KnowledgeMedication);
  console.log("Seeding Medications...");
  const medData = [
    {
      genericName: "Lisinopril",
      brandNames: ["Zestril", "Prinivil"],
      drugClass: "ACE Inhibitor",
      therapeuticCategory: "Antihypertensive",
      dosageForms: ["Tablets 5mg, 10mg, 20mg"],
      adultDosing: "Hypertension: Initial 10mg PO once daily. Maintenance 20-40mg PO once daily.",
      pregnancyCategory: "D (Avoid in 2nd and 3rd trimesters due to fetal toxicity)",
      lactationInformation: "Caution advised; limited data.",
      contraindications: ["History of angioedema", "Co-administration with aliskiren in diabetic patients"],
      precautions: ["Monitor serum creatinine and potassium levels", "Renal impairment"],
      sideEffects: ["Dry cough", "Hyperkalemia", "Dizziness", "Headache", "Renal dysfunction"],
      drugInteractions: ["Potassium-sparing diuretics", "NSAIDs", "Lithium"],
      monitoringRequirements: ["Serum potassium", "Renal function (creatinine, GFR)", "Blood pressure"],
      renalDoseAdjustment: "CrCl 10-30 mL/min: Initial 5mg PO daily. CrCl < 10 mL/min: Initial 2.5mg PO daily.",
      datasetVersion: "starter-2026.06",
    },
    {
      genericName: "Metformin",
      brandNames: ["Glucophage", "Fortamet"],
      drugClass: "Biguanide",
      therapeuticCategory: "Oral Antidiabetic",
      dosageForms: ["Tablets 500mg, 850mg, 1000mg", "Extended Release Tablets 500mg, 750mg"],
      adultDosing: "Initial 500mg PO twice daily or 850mg once daily with meals. Max 2550mg/day.",
      pregnancyCategory: "B",
      lactationInformation: "Enters breast milk; monitor infant.",
      contraindications: ["Severe renal impairment (eGFR < 30 mL/min)", "Acute or chronic metabolic acidosis"],
      precautions: ["Risk of lactic acidosis", "Discontinue prior to iodinated contrast procedures"],
      sideEffects: ["Nausea", "Diarrhea", "Flatulence", "Abdominal discomfort", "Vitamin B12 deficiency"],
      drugInteractions: ["Cimetidine", "Iodinated contrast dye", "Carbonic anhydrase inhibitors"],
      monitoringRequirements: ["eGFR", "Fasting blood glucose", "HbA1c", "B12 levels (long-term)"],
      renalDoseAdjustment: "eGFR < 30 mL/min: Contraindicated. eGFR 30-45 mL/min: Initial 500mg daily; limit max to 1000mg daily.",
      datasetVersion: "starter-2026.06",
    },
    {
      genericName: "Amoxicillin",
      brandNames: ["Amoxil", "Moxatag"],
      drugClass: "Penicillin Antibiotic",
      therapeuticCategory: "Antibacterial",
      dosageForms: ["Capsules 250mg, 500mg", "Oral Suspension 125mg/5mL, 250mg/5mL"],
      adultDosing: "Mild/Moderate infections: 250-500mg PO every 8 hours or 500-875mg PO every 12 hours. Severe: 875mg every 12 hours.",
      pregnancyCategory: "B",
      lactationInformation: "Safe; monitor infant for diarrhea.",
      contraindications: ["Hypersensitivity to penicillins"],
      precautions: ["Anaphylaxis risk", "Adjust dose in severe renal impairment", "Risk of C. difficile-associated diarrhea"],
      sideEffects: ["Diarrhea", "Nausea", "Vomiting", "Skin rash", "Oral candidiasis"],
      drugInteractions: ["Oral contraceptives (potential efficacy reduction)", "Allopurinol (rash risk)", "Probenecid"],
      monitoringRequirements: ["Renal and hepatic function with prolonged use"],
      renalDoseAdjustment: "GFR 10-30 mL/min: Max 500mg PO every 12 hours. GFR < 10 mL/min: Max 500mg PO every 24 hours.",
      datasetVersion: "starter-2026.06",
    },
    {
      genericName: "Artemether-Lumefantrine",
      brandNames: ["Coartem"],
      drugClass: "ACT (Artemisinin-based Combination Therapy)",
      therapeuticCategory: "Antimalarial",
      dosageForms: ["Tablets 20mg artemether / 120mg lumefantrine"],
      adultDosing: "Adults (>35kg): 4 tablets PO twice daily for 3 days (total 6 doses; 0, 8, 24, 36, 48, 60 hours). Take with fatty food.",
      pregnancyCategory: "C (Benefits typically outweigh risks in active malaria)",
      lactationInformation: "Excreted; use with caution.",
      contraindications: ["Severe malaria", "Concomitant use of strong CYP3A4 inhibitors", "Known QT prolongation"],
      precautions: ["Ensure adequate food intake (fatty meal)", "Monitor patients with severe vomiting"],
      sideEffects: ["Headache", "Dizziness", "Fatigue", "Palpitations", "Nausea", "Arthralgia"],
      drugInteractions: ["QT prolonging drugs", "Antiretroviral drugs (CYP3A4 interactions)", "Ketoconazole"],
      monitoringRequirements: ["Parasite clearance rate", "ECG in patients with cardiac risk factors"],
      renalDoseAdjustment: "No dose adjustment required in renal impairment.",
      datasetVersion: "starter-2026.06",
    },
    {
      genericName: "Omeprazole",
      brandNames: ["Prilosec"],
      drugClass: "Proton Pump Inhibitor (PPI)",
      therapeuticCategory: "Gastrointestinal Agent",
      dosageForms: ["Delayed Release Capsules 10mg, 20mg, 40mg"],
      adultDosing: "GERD: 20mg PO daily for 4-8 weeks. Peptic Ulcer: 20-40mg PO daily.",
      pregnancyCategory: "C",
      lactationInformation: "Excreted; compatible.",
      contraindications: ["Known hypersensitivity to PPIs"],
      precautions: ["Risk of bone fractures (long term)", "Hypomagnesemia", "Clostridium difficile infection risk"],
      sideEffects: ["Headache", "Abdominal pain", "Nausea", "Diarrhea", "Flatulence"],
      drugInteractions: ["Clopidogrel (decreases conversion to active metabolite)", "Ketoconazole", "Methotrexate"],
      monitoringRequirements: ["Magnesium levels with prolonged use", "Bone mineral density if at risk"],
      renalDoseAdjustment: "No dose adjustment required.",
      datasetVersion: "starter-2026.06",
    }
  ];

  for (const item of medData) {
    const existing = await medRepo.findOne({ where: { genericName: item.genericName } });
    if (existing) {
      Object.assign(existing, item);
      await medRepo.save(existing);
    } else {
      await medRepo.save(medRepo.create(item));
    }
  }

  // 3. Seed Diseases
  const diseaseRepo = AppDataSource.getRepository(KnowledgeDisease);
  console.log("Seeding Diseases...");
  const diseaseData = [
    {
      icd10Code: "I21.9",
      name: "Myocardial Infarction",
      alternativeNames: ["Heart Attack", "AMI", "STEMI", "NSTEMI"],
      bodySystem: "Cardiology",
      description: "Myocardial cell injury due to acute prolonged ischemia, typically precipitated by plaque rupture and coronary thrombosis.",
      epidemiology: "Leading cause of death globally. Incidence increases with age, hypertension, diabetes, and smoking.",
      causes: ["Atherosclerosis", "Plaque rupture", "Coronary thrombosis", "Coronary artery spasm"],
      riskFactors: ["Hypertension", "Hyperlipidemia", "Smoking", "Diabetes Mellitus", "Sedentary lifestyle", "Family history"],
      clinicalPresentation: "Acute substernal chest discomfort radiating to left arm, neck, or jaw, accompanied by dyspnea, sweating, and nausea.",
      symptoms: ["Chest pain", "Substernal chest pressure", "Shortness of breath", "Diaphoresis", "Nausea", "Anxiety", "Dizziness"],
      physicalSigns: ["Tachycardia", "Hypotension", "Third heart sound (S3)", "Diaphoresis", "Jugular venous distention (in right ventricular MI)"],
      differentialDiagnoses: ["GERD", "Aortic Dissection", "Pericarditis", "Pulmonary Embolism", "Pneumothorax", "Costochondritis"],
      recommendedInvestigations: ["ECG (12-Lead)", "Cardiac Troponins", "Coronary Angiography", "Echocardiogram", "Chest X-ray"],
      laboratoryFindings: ["Elevated high-sensitivity cardiac Troponin I/T", "Leukocytosis", "Elevated CRP"],
      imagingFindings: ["Regional wall motion abnormality on Echocardiogram", "Coronary stenosis/occlusion on Angiography"],
      firstLineTreatment: ["Aspirin 325mg PO chewed", "Clopidogrel or Ticagrelor", "Sublingual Nitroglycerin", "Primary PCI (percutaneous coronary intervention) within 90 minutes"],
      alternativeTreatment: ["Thrombolytic therapy (Alteplase, Tenecteplase) if PCI unavailable", "Unfractionated Heparin infusion"],
      complications: ["Arrhythmias", "Heart Failure", "Cardiogenic Shock", "Ventricular free wall rupture", "Papillary muscle rupture"],
      emergencyRedFlags: ["Hypotension (SBP < 90 mmHg)", "Signs of cardiogenic shock (cool extremities, confusion)", "Ventricular tachycardia/fibrillation", "Severe dyspnea"],
      followUpRecommendations: ["Cardiac rehabilitation", "Beta-blocker, ACE inhibitor, High-intensity Statin, Dual Antiplatelet Therapy (DAPT)"],
      patientEducation: "Instruct patient to seek immediate emergency care for recurrent chest pain. Counsel on smoking cessation, healthy diet, and adherence to medications.",
      evidenceLevel: "High",
      lastReviewed: "2026-06-15",
      datasetVersion: "starter-2026.06",
      references: [
        { title: "2023 ESC Guidelines for the management of acute coronary syndromes", source: "European Society of Cardiology", url: "https://www.escardio.org" }
      ]
    },
    {
      icd10Code: "J18.9",
      name: "Community-Acquired Pneumonia",
      alternativeNames: ["Pneumonia", "CAP", "Lung Infection"],
      bodySystem: "Respiratory",
      description: "Acute infection of the lung parenchyma acquired outside of a healthcare environment, caused by bacteria, viruses, or atypical pathogens.",
      epidemiology: "High morbidity and mortality in extremes of age (elderly and infants). Streptococcus pneumoniae remains the most common bacterial cause.",
      causes: ["Streptococcus pneumoniae", "Haemophilus influenzae", "Mycoplasma pneumoniae", "Respiratory viruses (Influenza, COVID-19)"],
      riskFactors: ["Age >= 65 years", "Chronic lung disease (COPD, Asthma)", "Immunosuppression", "Smoking", "Alcoholism"],
      clinicalPresentation: "Fever, chills, productive cough with purulent sputum, pleuritic chest pain, and progressive shortness of breath.",
      symptoms: ["Cough", "Fever", "Chills", "Pleuritic chest pain", "Shortness of breath", "Fatigue", "Myalgia"],
      physicalSigns: ["Tachypnea", "Tachycardia", "Decreased breath sounds", "Crepitations (Crackles)", "Dullness to percussion"],
      differentialDiagnoses: ["Acute Bronchitis", "Heart Failure", "Pulmonary Embolism", "COPD Exacerbation", "Tuberculosis"],
      recommendedInvestigations: ["Chest X-ray", "CBC", "Sputum Culture", "Blood Cultures", "Pulse Oximetry"],
      laboratoryFindings: ["Leukocytosis with left shift", "Elevated CRP or Procalcitonin", "Hypoxemia on ABG"],
      imagingFindings: ["Lobar consolidation or interstitial infiltrates on Chest X-ray"],
      firstLineTreatment: ["Outpatient: Amoxicillin 1g PO TID + Azithromycin 500mg day 1, then 250mg PO daily", "Inpatient: Ceftriaxone 1-2g IV daily + Azithromycin 500mg IV/PO daily"],
      alternativeTreatment: ["Respiratory Fluoroquinolones (Levofloxacin, Moxifloxacin) as monotherapy"],
      complications: ["Parapneumonic effusion", "Empyema", "Sepsis/Septic Shock", "Acute Respiratory Distress Syndrome (ARDS)"],
      emergencyRedFlags: ["Oxygen saturation < 90% on room air", "Hypotension (SBP < 90)", "Altered mental status / Confusion", "Respiratory rate >= 30/min"],
      followUpRecommendations: ["Follow-up Chest X-ray in 4-6 weeks for patients >50 y/o or smokers to document resolution and rule out malignancy"],
      patientEducation: "Complete the full antibiotic course. Educate on pneumococcal and influenza vaccines. Advise returning if symptoms worsen or dyspnea increases.",
      evidenceLevel: "High",
      lastReviewed: "2026-05-20",
      datasetVersion: "starter-2026.06",
      references: [
        { title: "ATS/IDSA Diagnosis and Treatment of Adults with Community-acquired Pneumonia", source: "American Thoracic Society / Infectious Diseases Society of America" }
      ]
    },
    {
      icd10Code: "B54",
      name: "Malaria",
      alternativeNames: ["Plasmodium infection", "Paludism"],
      bodySystem: "Infectious Diseases",
      description: "Mosquito-borne febrile illness caused by parasitic protozoa of the genus Plasmodium, transmitted via female Anopheles mosquitoes.",
      epidemiology: "Highly endemic in sub-Saharan Africa. Plasmodium falciparum causes the highest rate of severe morbidity and mortality.",
      causes: ["Plasmodium falciparum", "Plasmodium vivax", "Plasmodium ovale", "Plasmodium malariae"],
      riskFactors: ["Living in or traveling to endemic regions", "Lack of mosquito netting", "Pregnancy", "Children < 5 years"],
      clinicalPresentation: "Cyclical fever, chills, diaphoresis, headache, and generalized body aches, often accompanied by splenomegaly and mild jaundice.",
      symptoms: ["Fever", "Chills", "Diaphoresis", "Headache", "Myalgia", "Nausea", "Vomiting", "Fatigue"],
      physicalSigns: ["Splenomegaly", "Hepatomegaly", "Jaundice", "Pallor (due to hemolytic anemia)"],
      differentialDiagnoses: ["Typhoid Fever", "Dengue Fever", "Sepsis", "Influenza", "Meningitis", "Acute Gastroenteritis"],
      recommendedInvestigations: ["Thick and Thin Blood Smears", "Malaria Rapid Diagnostic Test (RDT)", "CBC", "Renal and Hepatic Panels"],
      laboratoryFindings: ["Plasmodium parasites visible on thin/thick smears", "Thrombocytopenia", "Anemia", "Elevated Bilirubin"],
      imagingFindings: ["Splenomegaly on abdominal ultrasound (if performed)"],
      firstLineTreatment: ["Uncomplicated Falciparum: Artemether-Lumefantrine (Coartem) twice daily for 3 days", "Severe Malaria: IV Artesunate 2.4 mg/kg at 0, 12, and 24 hours, then daily"],
      alternativeTreatment: ["Artesunate-Amodiaquine", "Dihydroartemisinin-Piperaquine"],
      complications: ["Cerebral malaria (encephalopathy)", "Severe hemolytic anemia", "Acute Kidney Injury", "Hypoglycemia", "Blackwater fever (hemoglobinuria)"],
      emergencyRedFlags: ["Impaired consciousness / Coma", "Generalized seizures", "Respiratory distress / Pulmonary edema", "Severe vomiting (inability to tolerate PO meds)", "Severe jaundice / Anuria"],
      followUpRecommendations: ["Re-check thin blood smear if symptoms persist to monitor for treatment resistance or recrudescence."],
      patientEducation: "Counsel on mosquito bite prevention (ITNs, insect repellents). Complete the full Coartem course. Seek immediate care for severe lethargy or dark urine.",
      evidenceLevel: "High",
      lastReviewed: "2026-04-10",
      datasetVersion: "starter-2026.06",
      references: [
        { title: "WHO Guidelines for malaria", source: "World Health Organization", url: "https://www.who.int" }
      ]
    },
    {
      icd10Code: "E11.9",
      name: "Diabetes Mellitus Type 2",
      alternativeNames: ["T2DM", "Non-insulin dependent diabetes", "Adult-onset diabetes"],
      bodySystem: "Endocrinology",
      description: "Chronic metabolic disorder characterized by insulin resistance, relative insulin deficiency, and progressive secretory dysfunction leading to hyperglycemia.",
      epidemiology: "Global epidemic driven by rising rates of obesity and physical inactivity. Significantly increases cardiovascular risk.",
      causes: ["Insulin resistance", "Impaired insulin secretion from pancreatic beta cells", "Genetic factors", "Environmental influences"],
      riskFactors: ["Obesity / Overweight", "Physical inactivity", "First-degree relative with diabetes", "Hypertension", "Dyslipidemia", "Gestational diabetes history"],
      clinicalPresentation: "Insidious onset. Often asymptomatic initially; may present with polyuria, polydipsia, polyphagia, fatigue, and blurry vision.",
      symptoms: ["Polyuria", "Polydipsia", "Polyphagia", "Blurry vision", "Fatigue", "Frequent infections", "Slow-healing wounds"],
      physicalSigns: ["Acanthosis nigricans", "Obesity (increased waist circumference)", "Peripheral neuropathy signs (decreased sensation)", "Decreased peripheral pulses"],
      differentialDiagnoses: ["Type 1 Diabetes Mellitus", "LADA (Latent Autoimmune Diabetes in Adults)", "Diabetes Insipidus", "Cushing's Syndrome"],
      recommendedInvestigations: ["Fasting Plasma Glucose (FPG)", "HbA1c", "Lipid Panel", "Serum Creatinine / eGFR", "Urine Microalbumin/Creatinine Ratio"],
      laboratoryFindings: ["HbA1c >= 6.5%", "Fasting Glucose >= 126 mg/dL", "Dyslipidemia (high LDL, low HDL, high Triglycerides)", "Microalbuminuria"],
      imagingFindings: ["None routinely; fundoscopy is critical to screen for retinopathy."],
      firstLineTreatment: ["Metformin 500mg-1000mg PO BID (titrated)", "Lifestyle modifications: Diet control, 150 min/week moderate physical exercise"],
      alternativeTreatment: ["SGLT2 Inhibitors (Empagliflozin)", "GLP-1 Receptor Agonists (Semaglutide)", "Sulfonylureas (Glimepiride)", "Basal Insulin (Glargine)"],
      complications: ["Diabetic Retinopathy", "Diabetic Nephropathy / End-stage renal disease", "Peripheral Neuropathy / Diabetic foot ulcers", "Coronary Artery Disease / Stroke"],
      emergencyRedFlags: ["Diabetic Ketoacidosis (nausea, vomiting, Kussmaul breathing, ketones in urine)", "Hyperosmolar Hyperglycemic State (profound dehydration, confusion, glucose > 600 mg/dL)"],
      followUpRecommendations: ["HbA1c evaluation every 3-6 months", "Annual microalbuminuria screening", "Annual dilated eye exam", "Regular foot inspections"],
      patientEducation: "Educate on self-monitoring of blood glucose. Counsel on diet (reduced simple carbs) and strict medication compliance. Teach daily foot checks.",
      evidenceLevel: "High",
      lastReviewed: "2026-06-10",
      datasetVersion: "starter-2026.06",
      references: [
        { title: "ADA Standards of Care in Diabetes", source: "American Diabetes Association", url: "https://diabetes.org" }
      ]
    }
  ];

  for (const item of diseaseData) {
    const existing = await diseaseRepo.findOne({ where: { icd10Code: item.icd10Code } });
    if (existing) {
      Object.assign(existing, item);
      await diseaseRepo.save(existing);
    } else {
      await diseaseRepo.save(diseaseRepo.create(item));
    }
  }

  // 4. Seed Guidelines
  const guideRepo = AppDataSource.getRepository(KnowledgeGuideline);
  console.log("Seeding Guidelines...");
  const guideData = [
    {
      guidelineName: "CURB-65 Pneumonia Pathway",
      specialty: "Respiratory",
      clinicalScenario: "Evaluation and severity scoring of adults presenting with community-acquired pneumonia to determine appropriate treatment setting (outpatient vs. inpatient vs. ICU).",
      workflowSteps: [
        "Assess for new-onset Confusion.",
        "Check Blood Urea Nitrogen (BUN) level: abnormal if > 19 mg/dL (> 7 mmol/L).",
        "Record Respiratory Rate: abnormal if >= 30/min.",
        "Check Blood Pressure: abnormal if SBP < 90 mmHg or DBP <= 60 mmHg.",
        "Check Age: positive if >= 65 years.",
        "Calculate score (1 point per positive criteria; range 0-5).",
        "Determine disposition: 0-1 points = Outpatient care; 2 points = Consider brief inpatient stay or close monitoring; >=3 points = Inpatient admission with assessment for ICU admission if score is 4 or 5."
      ],
      references: [{ title: "Lim WS et al. Thorax. 2003;58:377-382.", source: "British Thoracic Society" }],
      contentVersion: "starter-2026.06",
    },
    {
      guidelineName: "Wells Score for DVT Pathway",
      specialty: "Emergency Medicine",
      clinicalScenario: "Pre-test probability scoring for patients presenting with suspected lower extremity Deep Vein Thrombosis.",
      workflowSteps: [
        "Evaluate for active cancer (+1 point).",
        "Evaluate for paralysis, paresis, or recent lower extremity cast immobilization (+1 point).",
        "Check for history of being bedridden > 3 days or major surgery within 12 weeks (+1 point).",
        "Check for localized tenderness along deep venous system (+1 point).",
        "Check for swelling of the entire leg (+1 point).",
        "Measure calf circumference: positive if > 3 cm compared to asymptomatic leg (+1 point).",
        "Check for pitting edema confined to symptomatic leg (+1 point).",
        "Check for non-varicose collateral superficial veins (+1 point).",
        "Verify history of documented DVT (+1 point).",
        "Determine if alternative diagnosis is at least as likely as DVT (-2 points).",
        "Sum score: >= 2 points indicates 'DVT likely' -> refer for venous ultrasound. < 2 points indicates 'DVT unlikely' -> consider D-dimer test."
      ],
      references: [{ title: "Wells PS et al. Lancet. 1997;350:1795-1798.", source: "Wells DVT Criteria" }],
      contentVersion: "starter-2026.06",
    }
  ];

  for (const item of guideData) {
    const existing = await guideRepo.findOne({ where: { guidelineName: item.guidelineName, contentVersion: item.contentVersion } });
    if (existing) {
      Object.assign(existing, item);
      await guideRepo.save(existing);
    } else {
      await guideRepo.save(guideRepo.create(item));
    }
  }

  console.log("Seeding complete successfully!");
  await AppDataSource.destroy();
}

main().catch(err => {
  console.error("Seeding failed", err);
  process.exit(1);
});
