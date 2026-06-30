import { MigrationInterface, QueryRunner } from "typeorm";

export class ClinicalKnowledgeBaseSchema1782800000000 implements MigrationInterface {
    name = 'ClinicalKnowledgeBaseSchema1782800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create clinical_diseases table
        await queryRunner.query(`
            CREATE TABLE "clinical_diseases" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "deleted_at" TIMESTAMP WITH TIME ZONE, 
                "version" integer NOT NULL DEFAULT 1, 
                "name" character varying(255) NOT NULL, 
                "icd10_code" character varying(50) NOT NULL, 
                "description" text, 
                "symptoms" jsonb NOT NULL DEFAULT '[]'::jsonb, 
                "signs" jsonb NOT NULL DEFAULT '[]'::jsonb, 
                "investigations" jsonb NOT NULL DEFAULT '[]'::jsonb, 
                "treatments" jsonb NOT NULL DEFAULT '[]'::jsonb, 
                "red_flags" jsonb NOT NULL DEFAULT '[]'::jsonb, 
                "differentials" jsonb NOT NULL DEFAULT '[]'::jsonb, 
                "evidence_level" character varying(50) DEFAULT 'High', 
                "last_reviewed" date DEFAULT CURRENT_DATE, 
                CONSTRAINT "UQ_clinical_diseases_name" UNIQUE ("name"),
                CONSTRAINT "PK_clinical_diseases" PRIMARY KEY ("id")
            )
        `);

        // Seed default diseases
        const diseases = [
            {
                name: "Pneumonia",
                icd10_code: "J18.9",
                description: "An infection that inflames the air sacs in one or both lungs, which may fill with fluid or pus.",
                symptoms: ["Fever", "Cough", "Chills", "Chest pain", "Shortness of breath", "Fatigue"],
                signs: ["Crackles", "Tachypnea", "Low oxygen saturation"],
                investigations: ["CBC", "CRP", "Chest X-ray", "Blood culture", "Sputum culture"],
                treatments: ["Amoxicillin", "Azithromycin", "Ceftriaxone"],
                red_flags: ["SpO2 < 90%", "Confusion", "Septic shock", "Respiratory distress"],
                differentials: ["Tuberculosis", "COVID-19", "Asthma", "COPD exacerbation", "Pulmonary embolism"],
            },
            {
                name: "Myocardial Infarction",
                icd10_code: "I21.9",
                description: "A heart attack occurs when blood flow decreases or stops to a part of the heart, causing damage to the heart muscle.",
                symptoms: ["Chest pain", "Substernal chest pain", "Radiating pain to left arm", "Radiating pain to jaw", "Diaphoresis", "Shortness of breath", "Nausea", "Anxiety"],
                signs: ["Hypotension", "Arrhythmia", "Pallor"],
                investigations: ["ECG", "Troponin", "Creatine Kinase-MB", "Coronary Angiography"],
                treatments: ["Aspirin", "Nitroglycerin", "Morphine", "Clopidogrel", "Heparin", "PCI (Angioplasty)"],
                red_flags: ["Systolic BP < 90 mmHg", "Syncope", "Ventricular Fibrillation", "Cardiogenic shock"],
                differentials: ["GERD", "Pericarditis", "Costochondritis", "Pulmonary Embolism", "Aortic Dissection"],
            },
            {
                name: "Malaria",
                icd10_code: "B54",
                description: "A life-threatening disease caused by parasites that are transmitted to people through the bites of infected female Anopheles mosquitoes.",
                symptoms: ["Fever", "High fever", "Chills", "Sweats", "Headache", "Myalgia", "Splenomegaly", "Vomiting"],
                signs: ["Jaundice", "Anemia", "Hepatomegaly"],
                investigations: ["Malaria Smear", "CBC", "Bilirubin"],
                treatments: ["Artemether-Lumefantrine", "Coartem", "Artesunate", "Chloroquine"],
                red_flags: ["Altered consciousness", "Cerebral Malaria", "Severe anemia", "Hypoglycemia", "Hemoglobinuria"],
                differentials: ["Typhoid Fever", "Yellow Fever", "Dengue Fever", "Sepsis"],
            },
            {
                name: "Typhoid Fever",
                icd10_code: "A01.0",
                description: "A bacterial infection caused by Salmonella typhi, characteristically presenting with step-ladder fever and abdominal symptoms.",
                symptoms: ["Fever", "Step-ladder fever", "Headache", "Abdominal pain", "Rose spots", "Constipation", "Diarrhea", "Bradycardia"],
                signs: ["Coated tongue", "Hepatomegaly", "Splenomegaly"],
                investigations: ["Widal test", "Blood culture", "Stool culture", "CBC"],
                treatments: ["Ciprofloxacin", "Ceftriaxone", "Azithromycin"],
                red_flags: ["Intestinal perforation", "GI bleeding", "Altered mental status"],
                differentials: ["Malaria", "Typhus", "Brucellosis", "Gastroenteritis"],
            },
            {
                name: "GERD",
                icd10_code: "K21.9",
                description: "Gastroesophageal reflux disease occurs when stomach acid repeatedly flows back into the tube connecting your mouth and stomach.",
                symptoms: ["Heartburn", "Acid regurgitation", "Dysphagia", "Chronic cough", "Chest pain"],
                signs: ["Dental erosions"],
                investigations: ["Upper Endoscopy", "pH monitoring", "Esophageal Manometry"],
                treatments: ["Omeprazole", "Ranitidine", "Antacids"],
                red_flags: ["Dysphagia", "Weight loss", "GI bleeding", "Anemia"],
                differentials: ["Myocardial Infarction", "Esophageal Spasm", "Peptic Ulcer Disease"],
            },
            {
                name: "Pulmonary Embolism",
                icd10_code: "I26.9",
                description: "A blockage in one of the pulmonary arteries in your lungs, usually caused by blood clots that travel to the lungs from deep veins in the legs.",
                symptoms: ["Shortness of breath", "Pleuritic chest pain", "Cough", "Hemoptysis", "Anxiety"],
                signs: ["Tachypnea", "Tachycardia", "Leg swelling"],
                investigations: ["D-Dimer", "CT Pulmonary Angiography", "ECG", "VQ scan"],
                treatments: ["Heparin", "Enoxaparin", "Warfarin", "Thrombolytics"],
                red_flags: ["Hypotension", "Syncope", "Severe hypoxemia", "Right ventricular strain"],
                differentials: ["Myocardial Infarction", "GERD", "Pneumothorax", "Pneumonia", "Panic Attack"],
            }
        ];

        for (const d of diseases) {
            await queryRunner.query(`
                INSERT INTO "clinical_diseases" 
                ("name", "icd10_code", "description", "symptoms", "signs", "investigations", "treatments", "red_flags", "differentials") 
                VALUES (
                    $1, $2, $3, 
                    $4::jsonb, $5::jsonb, $6::jsonb, 
                    $7::jsonb, $8::jsonb, $9::jsonb
                )
            `, [
                d.name, 
                d.icd10_code, 
                d.description, 
                JSON.stringify(d.symptoms), 
                JSON.stringify(d.signs), 
                JSON.stringify(d.investigations), 
                JSON.stringify(d.treatments), 
                JSON.stringify(d.red_flags), 
                JSON.stringify(d.differentials)
            ]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "clinical_diseases"`);
    }
}
