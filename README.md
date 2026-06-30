# MedLink Addis EMR & HMS

An enterprise-grade, multi-tenant Electronic Medical Record (EMR) and Hospital Management System (HMS) tailored for modern clinic administration, inpatient ward management, pharmacy dispensing, billing desks, and live clinical consultations.

---

## 🏗️ System Architecture & Folder Layout

The repository is organized as a multi-project workspace containing a **Next.js Frontend Client** and a **NestJS Backend REST API**:

```
Med link addis/
├── medlink-addis/           # Next.js 15+ Frontend Client (Tailwind CSS, Zustand, Lucide)
├── medlink-api/             # NestJS Backend API (TypeORM, PostgreSQL/Supabase, JWT Auth)
├── Assets/                  # Design assets and static mock resources
├── Spec.md                  # Comprehensive clinical specifications
├── README.md                # System Architecture & Documentation (this file)
└── .gitignore               # Multi-project exclusions (ignores .env and node_modules)
```

---

## 🖥️ Frontend Architecture (`medlink-addis`)

The client application is built using the **Next.js App Router** structure with central Zustand state stores.

### 📂 Directory Map
```
medlink-addis/
├── app/
│   ├── layout.tsx           # Root HTML layout and fonts loader
│   ├── page.tsx             # Root page (auth redirect checker)
│   ├── login/
│   │   └── page.tsx         # Secure login screen with tenant domain selector
│   └── (app)/               # Authed app layouts & sidebar workspace shell
│       ├── layout.tsx       # Auth status verification & sidebar navigator wrapper
│       ├── dashboard/
│       │   └── page.tsx     # KPI Metrics dashboard (custom views for Admin, Doctor, Nurse, etc.)
│       ├── patients/
│       │   ├── page.tsx     # Master Patient Index (MPI) registry & listing
│       │   └── [id]/
│       │       └── page.tsx # In-depth Patient Profile Chart (timeline logs, prescriptions, vitals)
│       ├── admissions/
│       │   └── page.tsx     # Ward & Bed occupancy map (interactive assigning & releasing beds)
│       ├── billing/
│       │   └── page.tsx     # Billing desk (invoice creation, payment recording, prints)
│       ├── pharmacy/
│       │   └── page.tsx     # Pharmacy inventory controller & prescription dispenser
│       ├── laboratory/
│       │   └── page.tsx     # Lab orders tracker & drag-and-drop clinical scan uploader
│       ├── emergency/
│       │   └── page.tsx     # ER Triage Queue (ESI sorting, vitals logging, patient waitlist)
│       ├── telemedicine/
│       │   └── page.tsx     # General telehealth consultations dashboard
│       ├── settings/
│       │   └── page.tsx     # System Admin dashboard (User registry, HIPAA Compliance Audit logs)
│       └── clinical/
│           ├── page.tsx     # Active Doctor Workspace (Gemini AI Scribe, Live Split-screen Video Consultation)
│           └── [encounterId]/page.tsx
├── components/
│   ├── Sidebar.tsx          # Collapsible responsive navigator matching role permissions
│   └── Topbar.tsx           # Global workspace header, active tenant context, and user logout
├── store/                   # Zustand central stores
│   ├── authStore.ts         # User session, JWT tokens, tenant details
│   ├── patientsStore.ts     # Master patient demographics & timeline events
│   ├── bedsStore.ts         # Inpatient wards, bed occupancy, ward admissions
│   ├── laboratoryStore.ts   # Lab orders, attachments upload states
│   ├── pharmacyStore.ts     # Inventory tracking, prescription dispense events
│   ├── usersStore.ts        # Staff members list and user creations
│   └── ...
└── lib/
    └── api.ts               # Axios client instance with automatic JWT authorization header injection
```

---

## ⚙️ Backend Architecture (`medlink-api`)

The API layer is built using **NestJS**, structuring domain logic into decoupled modules representing clinical capabilities.

### 📂 Directory Map
```
medlink-api/
├── src/
│   ├── main.ts              # NestJS entry point (CORS setup, Global Validation pipes)
│   ├── app.module.ts        # App Module (imports all core, database, and feature modules)
│   ├── core/
│   │   └── database/        # TypeORM connection config & base Tenant entities
│   ├── shared/              # Global shared enums (User roles, permission guards)
│   └── modules/             # decoupled NestJS feature modules
│       ├── auth/            # JWT strategies, guards, decorators, password hashers
│       ├── users/           # Staff accounts management, Role-Based Access Control (RBAC)
│       ├── patients/        # Patient entities, MPI controller, patient timeline logs
│       ├── beds/            # Inpatient bed entities, ward maps, ward admission logs
│       ├── pharmacy/        # Pharmacy inventory database, prescription dispensing
│       ├── laboratory/      # Lab order tracking, results, and upload attachments
│       ├── emergency/       # ER Triage, ESI categories, vital signs records
│       ├── dashboard/       # Aggregated KPIs and telemetry metrics
│       └── ai/              # Ambient Scribe controller invoking Gemini 1.5 Flash models
```

---

## 🔐 Security & Access Control Matrix

The EMR implements strict **Role-Based Access Control (RBAC)** across both frontend widgets and backend endpoints:

| Feature / Page | Hospital Admin | Doctor | Nurse | Pharmacist | Cashier | Triage Nurse |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Financial KPIs & Revenue** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Staff Registry & Settings**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Security Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Patient Registration** | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Active Doctor Workspace**  | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Telehealth Call Start**    | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Emergency Triage Queue**   | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Dispense Medications**    | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Record Cashier Payments**  | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 🚀 Quick Launch Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database Instance (or Supabase Connection String)

### 1. Database Configuration
In `medlink-api`, copy your database connection details into `.env`:
```env
DATABASE_URL=postgresql://postgres:[password]@db.supabase.co:5432/postgres
JWT_SECRET=EMR_SUPER_SECRET_KEY
GEMINI_API_KEY=AIzaSy...
```

### 2. Run the Backend REST API
```bash
cd medlink-api
npm install
# Seed default roles, admin user, wards, and beds
npm run seed
# Start backend server
npm run start:dev
```

### 3. Run the Next.js Client
In `medlink-addis`, ensure `.env` matches the backend endpoint:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```
Then start the dev server:
```bash
cd medlink-addis
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
