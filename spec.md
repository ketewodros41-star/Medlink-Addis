# MedLink Addis — Enterprise Software Requirements Specification (SRS)

**Version:** 1.0.0  
**Status:** Draft — Pending Engineering Review  
**Classification:** Internal — Confidential  
**Last Updated:** 2026-06-29  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope & Goals](#2-scope--goals)
3. [System Architecture](#3-system-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Folder Structure](#5-folder-structure)
6. [Domain Modules](#6-domain-modules)
7. [Core Infrastructure](#7-core-infrastructure)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [API Standards](#9-api-standards)
10. [Database Design Principles](#10-database-design-principles)
11. [Security Requirements](#11-security-requirements)
12. [Compliance & Interoperability](#12-compliance--interoperability)
13. [Non-Functional Requirements](#13-non-functional-requirements-nfrs)
14. [Observability](#14-observability)
15. [Testing Strategy](#15-testing-strategy)
16. [CI/CD Pipeline](#16-cicd-pipeline)
17. [Coding Standards](#17-coding-standards--conventions)
18. [Documentation Requirements](#18-documentation-requirements)
19. [Phased Roadmap](#19-phased-development-roadmap)
20. [Open Questions & Risks](#20-open-questions--risks)

---

## 1. Executive Summary

**MedLink Addis** is a fully integrated Hospital Operating System (HOS) designed to serve hospitals from small clinics to multi-campus enterprise health networks. It combines:

- **EMR** (Electronic Medical Records)
- **ERP** (Hospital Resource Planning — Finance, HR, Inventory, Procurement)
- **Clinical Operations** (Lab, Radiology, Pharmacy, Surgery, ICU, Emergency)
- **Telemedicine Platform**
- **AI-Assisted Clinical Decision Support**
- **Patient-Facing Portal & Mobile API**

This is not a CRUD application. Every design decision must favor long-term scalability, regulatory compliance, data integrity, and clinical safety.

---

## 2. Scope & Goals

### In Scope

| Category | Description |
|---|---|
| Clinical | EMR, patient management, appointments, vitals, diagnoses, prescriptions |
| Ancillary | Laboratory, Radiology, Pharmacy |
| Operations | Admissions, Ward/Bed management, Surgery, ICU, Emergency/Triage |
| Support | Ambulance dispatch, Telemedicine |
| Business | Billing, Insurance claims, Finance/Accounting, Inventory, Procurement |
| HR | Staff management, Shifts, Payroll integration, Attendance |
| Platform | Auth, RBAC, Audit, Notifications, File storage, Search |
| AI | Medical scribe, clinical summaries, drug interaction checks, forecasting |
| Integrations | FHIR R4, HL7 v2, Payment gateways, National ID, Wearables |
| Analytics | KPI dashboards, operational reports, disease surveillance |

### Out of Scope (v1)

- Direct PACS/DICOM image processing (metadata only; PACS integration layer is in-scope)
- Insurance underwriting systems
- Wearable real-time streaming (hook provided, not implemented)
- Payroll direct disbursement (integration hook only)

---

## 3. System Architecture

### 3.1 Architectural Style

Modular Monolith with a clear migration path to Microservices.

The system is architected as a **modular monolith** with strict domain isolation. Each domain module is self-contained and communicates exclusively through:

1. **Internal Event Bus** (domain events) — for decoupled async side effects
2. **Typed Service Interfaces** — for synchronous cross-module calls
3. **Domain Contracts / DTOs** — no leaking of internal entities across module boundaries

> **Rule:** No module may import another module's Repository, Entity, or ORM model. Violations block code review.

This design allows any module to be extracted into an independent microservice in the future with minimal refactoring.

### 3.2 Design Patterns

| Pattern | Application |
|---|---|
| Domain-Driven Design (DDD) | Each module maps to a bounded context |
| Clean Architecture | Dependency rule enforced (domain → application → infrastructure) |
| SOLID | All classes follow single responsibility and open/closed principles |
| CQRS-Ready | Command and Query handlers separated; event sourcing optional per module |
| Repository Pattern | All data access abstracted; services never touch ORM directly |
| Dependency Injection | NestJS IoC container used throughout |
| Saga / Process Manager | Multi-step workflows (e.g., admission → billing → discharge) |
| Outbox Pattern | Reliable event publishing to prevent dual-write consistency failures |

### 3.3 Multi-Tenancy

- **Tenant model:** Organization-scoped data (`hospital_id` column on all tenant-specific tables)
- **Isolation:** Row-level security enforced at application layer
- Super Admin can manage multiple hospitals
- Feature flags togglable per tenant

---

## 4. Tech Stack

### Backend

| Layer | Technology | Rationale |
|---|---|---|
| Framework | NestJS (TypeScript) | Opinionated, modular, enterprise-grade |
| Language | TypeScript (strict mode) | Type safety, maintainability |
| ORM | TypeORM | Mature, DI-friendly, migration support |
| Database | PostgreSQL 15+ | ACID, JSONB, partitioning, extensions |
| Cache / Queue | Redis 7+ | Sessions, rate limiting, BullMQ queues |
| Job Queue | BullMQ | Reliable background jobs, dead letter support |
| Search | Elasticsearch / OpenSearch | Full-text, fuzzy, faceted search |
| File Storage | S3-compatible (MinIO / AWS S3) | DICOM, documents, lab reports |
| Realtime | Socket.IO (NestJS Gateway) | Alerts, queue status, live dashboards |
| Email | Nodemailer + SMTP / SendGrid | Transactional emails |
| SMS | Africa's Talking / Twilio / Infobip | Multi-provider, pluggable |
| Monitoring | Prometheus + Grafana | Metrics and alerting |
| Tracing | OpenTelemetry | Distributed tracing |
| Logging | Winston + Loki | Structured JSON logs |

### Infrastructure

| Component | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes (production) |
| CI/CD | GitHub Actions |
| Secret Management | HashiCorp Vault / AWS Secrets Manager |
| CDN | CloudFront / Cloudflare |

---

## 5. Folder Structure

```
src/
├── core/
│   ├── common/
│   ├── config/
│   ├── database/
│   ├── redis/
│   ├── queue/
│   ├── storage/
│   ├── mail/
│   ├── sms/
│   ├── search/
│   ├── events/
│   ├── websocket/
│   ├── scheduler/
│   ├── health/
│   ├── monitoring/
│   ├── audit/
│   ├── rate-limit/
│   ├── cache/
│   ├── feature-flags/
│   ├── localization/
│   └── permissions/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── patients/
│   ├── appointments/
│   ├── clinical/
│   ├── doctors/
│   ├── nurses/
│   ├── laboratory/
│   ├── radiology/
│   ├── pharmacy/
│   ├── inventory/
│   ├── billing/
│   ├── finance/
│   ├── insurance/
│   ├── admissions/
│   ├── wards/
│   ├── emergency/
│   ├── icu/
│   ├── surgery/
│   ├── ambulance/
│   ├── telemedicine/
│   ├── hr/
│   ├── notifications/
│   ├── files/
│   ├── analytics/
│   ├── ai/
│   └── settings/
│
└── shared/
    ├── interfaces/
    ├── enums/
    ├── constants/
    └── types/
```

Each module internal structure:

```
modules/<domain>/
├── controllers/
├── services/
├── repositories/
├── entities/
├── dto/
├── interfaces/
├── guards/
├── events/
├── listeners/
├── validators/
├── constants/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 6. Domain Modules

### 6.1 Auth Module

**Responsibility:** Identity, session management, token lifecycle.

**Features:**

- JWT access tokens (15 min TTL) + refresh tokens (7-day TTL, rotated on use)
- Refresh token stored in Redis with device fingerprint
- OAuth2 / OpenID Connect ready (Google, Microsoft Azure AD)
- Optional SSO (SAML 2.0 adapter hook)
- Magic link login (email-based, 10-min TTL)
- Multi-Factor Authentication (TOTP via Google Authenticator / Authy)
- Device tracking & trusted device registry
- Concurrent session limits (configurable per role)
- Session revocation (single device or all devices)
- Login history with IP, device, browser, location
- Token blacklisting via Redis
- Password policies: min length, complexity, no-reuse (last 5), expiry configurable
- Forgot / reset password with time-limited secure tokens
- Email & phone OTP verification

**Domain Events:** `auth.user.logged_in`, `auth.user.logged_out`, `auth.user.password_changed`, `auth.user.mfa_enabled`, `auth.session.revoked`

---

### 6.2 Users Module

**Responsibility:** Staff accounts, profiles, role assignments.

**Roles (built-in):**

| Role | Description |
|---|---|
| super_admin | Platform-level admin, all hospitals |
| hospital_admin | Full access within one hospital |
| doctor | Clinical care, prescriptions |
| specialist | Subspecialty-restricted doctor |
| nurse | Nursing care, vitals, medication admin |
| receptionist | Patient registration, appointments |
| cashier | Payments, invoice processing |
| pharmacist | Prescription dispensing, pharmacy stock |
| radiologist | Radiology orders and reports |
| lab_technician | Sample processing, result entry |
| insurance_officer | Claims, pre-auth |
| finance_officer | Ledger, journal entries |
| hr_manager | Staff, payroll, attendance |
| inventory_manager | Stock, procurement |
| ambulance_staff | Dispatch, vehicle ops |
| patient | Patient portal access |
| guest | Unauthenticated read-only public API |

---

### 6.3 Permissions Module

**Model:** RBAC with ABAC extension points.

**Permission format:** `<Resource>.<Subresource>.<Action>`

**Examples:**
- `Patient.Read`, `Patient.Write`, `Patient.Delete`
- `Patient.MedicalRecord.Access`
- `Billing.Invoice.Create`, `Billing.Invoice.Approve`, `Billing.Invoice.Void`
- `Lab.Order.Create`, `Lab.Result.Publish`, `Lab.Result.CriticalAlert.Override`
- `Inventory.Stock.Edit`, `Inventory.PurchaseOrder.Approve`
- `Pharmacy.ControlledDrug.Dispense`
- `Surgery.OperatingRoom.Schedule`
- `ICU.Ventilator.Assign`

Permissions stored in database. Roles aggregate permissions. Custom role-permission mappings per hospital.

---

### 6.4 Patient Module

**Responsibility:** Complete Electronic Medical Record (EMR) per patient.

**Entities:**

| Entity | Key Fields |
|---|---|
| Patient | MRN, national ID, passport, photo, DOB, blood type, gender |
| EmergencyContact | Name, relationship, phone, priority |
| PatientInsurance | Provider, policy number, coverage type, validity |
| MedicalHistory | Conditions, surgeries, hospitalizations |
| FamilyHistory | Conditions with relationship mapping |
| Allergy | Substance, severity, reaction type, verification status |
| ChronicCondition | ICD-10 code, onset, status |
| Vaccination | Vaccine, dose, date, batch, provider |
| Lifestyle | Smoking, alcohol, diet, occupation, exercise |
| PatientDocument | Type, file reference, upload date |
| ConsentRecord | Consent type, signed date, witness, file |
| PatientVisit | Visit type, date, department, provider |
| MedicalFlag | Flag type (allergy, fall risk, infectious), priority |

**Features:**
- Master Patient Index (MPI) with duplicate detection
- Patient merge workflow with audit trail
- Global patient timeline (all visits, labs, prescriptions, vitals)
- Multi-address, multi-phone support
- Patient QR code for bedside identification
- Consent management with versioned consent forms
- Full-text search (Elasticsearch)

**Domain Events:** `patient.registered`, `patient.updated`, `patient.merged`, `patient.admitted`, `patient.discharged`, `patient.flag.added`

---

### 6.5 Appointment Module

- Doctor availability management (recurring schedules, leave blocking, overrides)
- Appointment booking: in-person, telemedicine, walk-in
- Recurring appointment series support
- Queue management with real-time position updates (WebSocket)
- Cancellation policies with grace period enforcement
- Reschedule flow with history
- No-show tracking with automated follow-up
- Reminder engine (SMS/email: 24h, 2h before)
- Waitlist management (auto-promote on cancellation)
- Priority appointments (emergency, VIP, referral-based)
- Room / consultation bay assignment
- iCal / Google Calendar / Outlook export

---

### 6.6 Clinical Module

**SOAP Notes:** Structured S/O/A/P, voice transcription hook, AI-assisted documentation, template library per specialty, draft/sign/co-sign workflow.

**Diagnoses:** ICD-10-CM coded with autocomplete, primary/secondary/differential, history per patient.

**Procedures:** CPT-coded, performed vs. ordered tracking.

**Vitals:** BP, pulse, temp, SpO2, RR, weight, height, BMI, pain scale; trend charting; out-of-range alerting.

**Treatment Plans:** Goals, interventions, timelines, multi-disciplinary team assignments.

**Referrals:** Internal and external, referral letter PDF generation, status tracking.

**Medical Certificates:** Sick leave, fitness-to-work, digitally signed PDF generation.

**Admission/Discharge:** Admission orders, discharge summaries (AI-assisted), patient-facing discharge instructions.

---

### 6.7 Laboratory Module

**Workflow:** Order → Sample Collection → Transport → Processing → Validation → Approval → Report → Notify

- Test catalog (panels, profiles, individual tests) with CPT codes
- Sample barcode generation (Code 128 / QR)
- Chain of custody tracking
- Analyzer/machine integration hooks (HL7 v2 MLLP)
- Reference ranges (age, sex, unit-specific)
- Two-level validation: technician entry → pathologist approval
- Critical value alerting (immediate notification to ordering doctor)
- Quality control records
- PDF report generation
- Turnaround time (TAT) tracking and SLA alerts
- Specimen rejection workflow with reason codes

---

### 6.8 Radiology Module

**Workflow:** Order → Schedule → Imaging → Report → Review → Approve → Notify

- Radiology order management (X-ray, CT, MRI, Ultrasound, etc.)
- Modality scheduling with technologist assignment
- PACS integration layer (DICOM metadata management; viewer URL embedding)
- Structured radiology report templates per modality
- Radiologist assignment and approval workflow
- AI assistance hook (flag for AI second-read)
- Report PDF generation and TAT tracking

---

### 6.9 Pharmacy Module

**Drug Catalog:** Generic/brand name mapping, drug class, form, strength, ATC classification, controlled drug flagging (Schedule I–V).

**Prescriptions:** Electronic from clinical module, drug interaction checking (OpenFDA/RxNav hooks), contraindication checking against patient allergies, pharmacist review workflow, partial dispensing support.

**Inventory:** Batch and expiry tracking, FEFO dispensing logic, near-expiry alerts, reorder point config, supplier management, purchase order workflow, inter-pharmacy/ward stock transfers.

**Controlled Drugs:** Separate controlled drug register, dual authorization for Schedule I/II, full chain of custody per unit.

---

### 6.10 Inventory Module

- Multi-warehouse / multi-location support
- Asset registry (medical equipment, infrastructure)
- Consumables catalog with unit of measure
- Purchase Request → Purchase Order → Goods Receipt → Issuing workflow
- Vendor management with performance tracking
- RFID and barcode scanning support (hardware integration hook)
- Preventive maintenance scheduling
- Demand forecasting hooks (AI module)
- Low-stock and overstock alerts

---

### 6.11 Billing Module

- Charge capture from all service modules (lab, pharmacy, surgery, room, etc.)
- Itemized invoice generation
- Tax configuration (VAT, withholding, configurable per item)
- Discount rules (fixed, percentage, condition-based)
- Insurance billing: pre-authorization, claims submission, adjudication tracking
- Payment processing (cash, card, mobile money, bank transfer)
- Multiple payment gateway support (pluggable adapter pattern)
- Installment / payment plan management
- Refund and void workflows with approvals
- Receipt generation (PDF)
- Revenue recognition journal entries published to Finance module
- Package billing and corporate/employer billing

---

### 6.12 Finance Module

- Chart of accounts (configurable hierarchy)
- General Ledger with journal entries
- Accounts Receivable and Accounts Payable
- Budget management (departmental, variance analysis)
- Financial period close process
- Payroll integration hook
- Financial reports: P&L, Balance Sheet, Cash Flow, Trial Balance
- Audit trail on all financial transactions
- Multi-currency support with exchange rate management

---

### 6.13 HR Module

- Employee profiles (personal, professional, emergency contacts)
- Department and team structure
- Shift scheduling (rotating, fixed, on-call patterns)
- Attendance tracking (biometric integration hook, manual entry)
- Leave management with approval workflow
- Payroll data management (salary grades, allowances, deductions)
- Training records and certifications with expiry alerts
- Performance review cycles
- Recruitment (job postings, applicant tracking, interview scheduling)
- Staff credentialing (medical licenses, expiry tracking, verification)

---

### 6.14 Admissions Module

**Workflow:** Referral/ED → Admission Request → Bed Allocation → Clinical Handover → Transfer → Discharge

- Bed management: ward → room → bed hierarchy
- Real-time bed occupancy dashboard (WebSocket)
- Patient transfer (inter-ward, inter-department, inter-hospital)
- Discharge planning checklist and summary generation
- Length of stay (LOS) tracking and alerts
- Housekeeping status integration (bed cleaning before reassignment)

---

### 6.15 ICU Module

- ICU patient census
- Ventilator and life support equipment assignment
- Hourly vitals charting
- Medication pump documentation
- Nursing care rounds documentation
- Critical alert pipeline (escalation matrix)
- Sedation/pain scoring (RASS, NRS)
- ICU scoring (APACHE II, SOFA — formula-based)
- ICU medication administration record (MAR)

---

### 6.16 Surgery Module

- Operative case scheduling (conflict-checked against OR calendar)
- Operating room management (setup, turnover time)
- Pre-operative assessment and checklist
- Anesthesia record
- Intraoperative and post-operative notes
- Surgical team assignment
- Surgical consent management
- Equipment and implant tracking
- WHO Surgical Safety Checklist

---

### 6.17 Emergency Module

**Workflow:** Arrival → Triage → Assessment → Treatment → Disposition

- Manchester Triage System (MTS) / ESI scoring
- Priority queue (P1–P5) with real-time status board
- Rapid registration for unconscious/unknown patients
- Trauma workflow activation (alerts via WebSocket + SMS)
- Mass Casualty Incident (MCI) mode
- Ambulance pre-arrival notification linkage
- Code Blue / Code Red alert broadcasting

---

### 6.18 Ambulance Module

- Vehicle registry (type, capacity, equipment)
- Driver management and dispatch
- GPS integration hook (position updates via webhook)
- Patient transfer coordination (pre-hospital care notes)
- Trip logs (origin, destination, patient, timestamps)
- Maintenance scheduling and fuel logs
- Ambulance-to-ED pre-arrival notification

---

### 6.19 Telemedicine Module

- Video consultation session management (Daily.co / Twilio Video / Jitsi adapter)
- Voice-only consultation support
- Secure in-session chat and file sharing
- Waiting room queue
- Prescription issuance post-consultation
- Consultation payment processing
- Session recording metadata and patient consent
- Consultation summary and follow-up instructions

---

### 6.20 Notifications Module

**Channels:** SMS, Email, Push (FCM / APNs), WhatsApp Business API, In-app

- Unified notification dispatch service
- Channel preference per user
- Template engine (Handlebars) with variable injection
- Scheduled notifications (appointment reminders, medication reminders)
- Priority levels (critical, high, normal, low)
- Retry queue with exponential backoff
- Delivery status tracking (sent, delivered, read, failed)
- Do Not Disturb windows (user-configurable)
- Bulk notification for mass health campaigns

---

### 6.21 AI Module

**Responsibility:** Centralized AI orchestration only. Business modules call AI services; they do not embed AI logic.

| Service | Description |
|---|---|
| MedicalScribeService | Transcribe voice → SOAP note draft |
| ClinicalSummaryService | Generate discharge/referral summaries |
| LabInterpretationService | Narrative interpretation of lab panels |
| RadiologyAssistService | Second-read flag, preliminary finding extraction |
| DrugInteractionService | Real-time interaction checking |
| AppointmentSuggestionService | Optimal slot suggestions based on patient history |
| HospitalCopilotService | Staff-facing conversational AI |
| InventoryForecastService | Demand forecasting for drugs and consumables |
| RiskPredictionService | Readmission risk, sepsis risk, deterioration scores |
| PromptManagementService | Versioned prompt templates |

**LLM Providers (pluggable):** OpenAI (GPT-4o), Google Gemini, Azure OpenAI, Anthropic Claude, Ollama (on-premise).

**Guardrails:** All AI outputs marked as AI-generated. Clinician confirmation required before output committed to clinical record. Full prompt/response logging for auditability.

---

### 6.22 Analytics Module

**Clinical KPIs:** Avg. length of stay, bed occupancy rate, readmission rate (30/90-day), mortality rate, diagnosis frequency heatmaps.

**Operational KPIs:** Appointment no-show rate, avg. wait time, lab TAT by test type, radiology TAT by modality, pharmacy dispensing time.

**Financial KPIs:** Revenue by department/doctor/service, outstanding receivables aging, insurance claim approval/rejection rate.

**Disease Surveillance:** Outbreak detection (threshold alerts on diagnosis frequency spikes), reportable disease tracking (EPHI-aligned).

**Implementation:** Pre-aggregated dashboard APIs (materialized views or scheduled ETL). Export to CSV/Excel/PDF.

---

### 6.23 File Management Module

- S3-compatible storage (MinIO on-premise, AWS S3 cloud)
- File types: PDF, images, video, DICOM metadata, Office documents
- Presigned URL generation (time-limited, per-request)
- File versioning (overwrite creates new version, not destructive)
- Virus scan hook (ClamAV / cloud AV)
- File metadata tagging (patient_id, document_type, encounter_id)
- Access control enforced by permissions module
- Soft delete with retention policy

---

## 7. Core Infrastructure

| Module | Technology | Purpose |
|---|---|---|
| Config | @nestjs/config + Joi | Validated env vars; fail-fast on missing config |
| Database | TypeORM + PostgreSQL | ORM, migrations, connection pooling |
| Redis | ioredis | Cache, sessions, queues, rate limiting |
| Queue | BullMQ | Background jobs, scheduled tasks |
| Mail | Nodemailer | Transactional email |
| SMS | Abstract adapter | Pluggable SMS provider |
| Storage | Abstract adapter | S3-compatible storage |
| Search | Elasticsearch client | Full-text search |
| Events | EventEmitter2 | Internal domain event bus |
| WebSocket | @nestjs/websockets + Socket.IO | Real-time updates |
| Scheduler | @nestjs/schedule | Cron jobs |
| Health | @nestjs/terminus | /health/ready, /health/live |
| Monitoring | prom-client | Prometheus metrics export |
| Audit | Global interceptor | Automatic audit log for all write operations |
| Rate Limiter | @nestjs/throttler + Redis store | Per-IP and per-user rate limits |
| Feature Flags | Custom service (DB-backed) | Per-tenant feature toggles |
| Localization | nestjs-i18n | Multi-language (Amharic + English v1) |

---

## 8. Authentication & Authorization

### 8.1 Token Strategy

```
POST /api/v1/auth/login
→ { accessToken: JWT (15min), refreshToken: opaque (7d, Redis-stored) }

POST /api/v1/auth/refresh
→ { accessToken: new JWT }  # Refresh token rotated on use

POST /api/v1/auth/logout
→ Refresh token revoked in Redis
```

### 8.2 JWT Payload

```json
{
  "sub": "user-uuid",
  "hospital_id": "hospital-uuid",
  "roles": ["doctor"],
  "permissions": ["Patient.Read", "Lab.Order.Create"],
  "session_id": "session-uuid",
  "device_id": "device-uuid",
  "iat": 1700000000,
  "exp": 1700000900
}
```

### 8.3 Guards

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('Billing.Invoice.Approve')
@RequireRole('finance_officer', 'hospital_admin')
```

Guards applied at controller level. Permissions are never checked in the service layer.

---

## 9. API Standards

### 9.1 Versioning

All APIs prefixed: `/api/v1/`. Breaking changes → `/api/v2/` (old version deprecated, not immediately removed).

### 9.2 Standard Response Envelope

```json
{
  "success": true,
  "message": "Patient retrieved successfully",
  "data": { },
  "meta": {
    "timestamp": "2026-01-01T00:00:00Z",
    "requestId": "req-uuid",
    "version": "v1"
  }
}
```

### 9.3 Paginated Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 1240,
    "page": 1,
    "limit": 20,
    "totalPages": 62,
    "cursor": "eyJ..."
  }
}
```

Support both offset-based and cursor-based pagination.

### 9.4 Error Format

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "No patient found with the given ID",
    "details": [],
    "requestId": "req-uuid",
    "timestamp": "2026-01-01T00:00:00Z"
  }
}
```

### 9.5 Standard Query Parameters

| Param | Type | Description |
|---|---|---|
| page | int | Page number (offset pagination) |
| limit | int | Page size (max 100) |
| cursor | string | Cursor token (cursor pagination) |
| sort | string | field:asc or field:desc |
| filter[field] | string | Field-level filter |
| q | string | Full-text search query |
| include | string | Comma-separated relations to eager-load |

### 9.6 HTTP Methods & Status Codes

| Operation | Method | Success Code |
|---|---|---|
| Create | POST | 201 |
| Read | GET | 200 |
| Update | PUT / PATCH | 200 |
| Delete (soft) | DELETE | 200 |
| Long async operation | POST | 202 Accepted + polling URL |

### 9.7 OpenAPI

Swagger UI at `/api/docs` (disabled in production by default, enabled via feature flag).

Every endpoint must have: summary, description, request body schema, response schemas, error responses.

---

## 10. Database Design Principles

### 10.1 Standard Columns (all tables)

```sql
id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at  TIMESTAMPTZ,
created_by  UUID REFERENCES users(id),
updated_by  UUID REFERENCES users(id),
hospital_id UUID REFERENCES hospitals(id)
```

### 10.2 Indexing Strategy

- Index all foreign keys
- Composite index on `(hospital_id, entity_id)` for tenant-scoped queries
- Partial index on `deleted_at IS NULL` for soft-deleted rows
- GIN index on JSONB columns used for filtering
- Primary search via Elasticsearch; Postgres tsvector as fallback

### 10.3 Migrations

- TypeORM migrations only (no `synchronize: true` in any environment)
- Migration files committed to source control
- Zero-downtime migrations required: additive changes only; breaking changes use expand-contract pattern

### 10.4 Partitioning

| Table | Strategy |
|---|---|
| audit_logs | Range by created_at (monthly) |
| notifications | Range by created_at (monthly) |
| vitals | Range by recorded_at (monthly) |
| lab_results | Range by resulted_at (quarterly) |

### 10.5 Optimistic Locking

All entities subject to concurrent writes include a `version` column (TypeORM `@VersionColumn()`).

---

## 11. Security Requirements

| Control | Implementation |
|---|---|
| Transport | TLS 1.2+ enforced; HTTP redirected to HTTPS |
| Headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| CORS | Allowlist-based; no wildcard in production |
| Input Validation | class-validator on all DTOs; ValidationPipe with whitelist:true |
| Output Sanitization | Sensitive fields stripped via @Exclude() on response DTOs |
| SQL Injection | TypeORM parameterized queries only; no string interpolation |
| Rate Limiting | Per-IP: 100 req/min general; 10 req/min auth endpoints |
| Secrets | Never in source code; loaded from Secrets Manager |
| Encryption at Rest | DB encryption via provider; sensitive columns via pgcrypto |
| PII Handling | Minimum necessary principle; data access logged |
| Request Signing | HMAC-SHA256 for webhook payloads and payment callbacks |
| Dependency Scanning | npm audit in CI; Snyk or Dependabot |

---

## 12. Compliance & Interoperability

### 12.1 HIPAA-Readiness

- All PHI access logged (user, timestamp, IP, reason)
- Minimum necessary access enforced via RBAC
- Data retention and destruction policies configurable per tenant
- Breach notification workflow (admin alert on anomalous bulk data access)

### 12.2 FHIR R4

Expose FHIR-compliant endpoints under `/fhir/r4/`:

`Patient`, `Observation`, `DiagnosticReport`, `MedicationRequest`, `Encounter`, `Appointment`, `AllergyIntolerance`, `Condition`

### 12.3 HL7 v2

- MLLP listener for lab analyzer integration (ADT, ORU, ORM messages)
- Inbound parser for patient demographics and lab results
- Outbound ADT messages for admission/discharge/transfer events

### 12.4 Ethiopian Healthcare Context

- Amharic localization (UI strings and notification templates)
- Ethiopian National ID integration hook
- Ethiopian Birr (ETB) as primary currency; multi-currency support
- Ethiopian public holiday calendar for scheduling
- NHIF integration hook for claims submission
- Reportable disease list aligned with Ethiopian Public Health Institute (EPHI)

---

## 13. Non-Functional Requirements (NFRs)

| Requirement | Target |
|---|---|
| Availability | 99.9% uptime (≤8.7 hrs downtime/year) |
| API Response Time P95 | <300ms read, <500ms write |
| API Response Time P99 | <1s |
| Throughput | 5,000 concurrent users; 500 req/sec sustained |
| Critical Alerts (Lab/Pharmacy) | <5 seconds trigger to delivery |
| WebSocket Event Latency | <500ms |
| Database Query P95 | <50ms for indexed lookups |
| File Upload | Up to 50MB; chunked upload for DICOM |
| Scalability | Horizontal scaling via stateless app servers |
| Recovery Time Objective (RTO) | <4 hours |
| Recovery Point Objective (RPO) | <1 hour (hourly DB backups) |
| Data Retention | Patient records: 10 years minimum |
| Multi-tenancy | Data isolation guaranteed per hospital |

---

## 14. Observability

### 14.1 Logging (Winston)

Mandatory log fields: `timestamp`, `level`, `requestId`, `correlationId`, `userId`, `hospitalId`, `module`, `message`

Separate append-only audit log stream (tamper-evident). Aggregated to Loki + Grafana or CloudWatch.

### 14.2 Metrics (Prometheus)

- HTTP request count, duration histogram by endpoint and status
- Queue depth and job processing time
- DB connection pool utilization
- Cache hit/miss ratio
- Error rate per module
- Business metrics: appointment bookings/hour, prescriptions dispensed/hour

### 14.3 Tracing (OpenTelemetry)

- Distributed trace per request (auto-instrumented)
- Trace exported to Jaeger / Grafana Tempo
- Correlation ID propagated across async jobs and events

### 14.4 Alerting Rules

- P95 latency > 500ms → warn
- Error rate > 1% → critical
- Queue depth > 1000 → warn
- DB connection pool > 80% → critical
- Critical lab result unacknowledged > 2 minutes → page on-call

### 14.5 Health Checks

```
GET /health/live   → liveness (process alive)
GET /health/ready  → readiness (DB, Redis, queue reachable)
```

---

## 15. Testing Strategy

| Layer | Tool | Coverage Target |
|---|---|---|
| Unit Tests | Jest | 90%+ service layer |
| Integration Tests | Jest + Supertest | All API endpoints |
| Repository Tests | Jest + testcontainers (PostgreSQL) | All repositories |
| E2E Tests | Jest + Supertest | Critical user journeys |
| Load Tests | k6 / Artillery | 2x expected peak load |
| Security Tests | OWASP ZAP (in CI) | OWASP Top 10 |

**Test Conventions:**
- Factories for all entities (using @faker-js/faker)
- Seed data scripts for consistent test environments
- Each test is fully isolated (no shared state)
- Database reset between integration test suites (testcontainers)
- All external services mocked in unit tests

**Critical E2E Journeys:**
1. Patient registration → appointment → encounter → lab order → result → billing
2. Emergency admission → triage → treatment → disposition
3. Prescription → pharmacy dispensing → billing
4. Telemedicine booking → video consultation → prescription → payment

---

## 16. CI/CD Pipeline

```
Triggers:
  Pull Request  → lint, test, security scan, build
  Merge to main → full pipeline + migration dry-run + staging deploy
  Tag (vX.Y.Z)  → production deploy

Steps:
  1. Lint (ESLint + Prettier check)
  2. Type check (tsc --noEmit)
  3. Unit tests (Jest)
  4. Integration tests (testcontainers)
  5. Security scan (npm audit + Snyk)
  6. Build Docker image
  7. Push to container registry (GHCR / ECR)
  8. Migration dry-run (validate SQL)
  9. Deploy to staging
  10. Smoke tests (automated)
  11. [Manual gate] Deploy to production
  12. Run DB migrations
  13. Health check verification
```

---

## 17. Coding Standards & Conventions

### TypeScript

- `strict: true` in tsconfig.json
- No `any` without documented justification
- Prefer `readonly` where mutation is not intended
- Use Result<T, E> pattern for fallible operations in domain layer

### NestJS Conventions

- One responsibility per service class
- Never expose entities directly from controllers — always map to Response DTO
- Use class-transformer (@Exclude(), @Expose()) on all response DTOs
- Interceptors for cross-cutting concerns (logging, response envelope, audit)
- Global exception filter — never catch errors silently

### Database

- Repository pattern only; no raw SQL in services (except optimized reporting queries — comment with `// REPORTING QUERY: <reason>`)
- Always use transactions for multi-step business workflows
- Idempotency keys on payment and external integration endpoints
- Never delete records — soft delete only

### Git & Commits

- Conventional Commits: feat:, fix:, refactor:, test:, docs:, chore:
- Husky pre-commit: lint + type check
- PR title must match conventional commit format
- All PRs require 1 approval minimum (2 for: billing, auth, pharmacy controlled drugs modules)
- No direct commits to `main`
- PR size guideline: <400 lines changed

---

## 18. Documentation Requirements

| Document | Owner | Tool |
|---|---|---|
| API Reference | Backend team | Swagger (auto-generated) |
| Architecture Diagram | Tech Lead | draw.io / Mermaid |
| Entity Relationship Diagram | Backend team | dbdiagram.io |
| Module Documentation | Module owner | Markdown in /docs/<module>.md |
| Deployment Guide | DevOps | Markdown |
| Environment Variables Reference | DevOps | .env.example + docs table |
| ADR (Architecture Decision Records) | Tech Lead | /docs/adr/ |
| Runbook | DevOps | Markdown |

---

## 19. Phased Development Roadmap

### Phase 1 — Platform Core (Weeks 1–6)

Auth, RBAC, Users, Audit Logs, Settings, Notifications (infrastructure), File Storage, Core Infrastructure (Redis, Queue, Mail, SMS).

**Milestone:** All staff can log in with MFA. Role/permission system functional. Files uploadable.

### Phase 2 — Clinical Core (Weeks 7–12)

Patients (EMR), Appointments, Doctors, Nurses, Clinical Module (vitals, SOAP, diagnoses), Admissions.

**Milestone:** A patient can be registered, an appointment booked, an encounter documented, and a patient admitted to a bed.

### Phase 3 — Ancillary Services (Weeks 13–18)

Laboratory, Radiology, Pharmacy (prescriptions + dispensing), Notifications (all channels live).

**Milestone:** Full OPD visit workflow: consult → lab → radiology → prescription → dispensing.

### Phase 4 — Business Operations (Weeks 19–24)

Billing (full invoice → payment cycle), Insurance, Finance (GL, AR, AP), Inventory, Procurement.

**Milestone:** A visit generates a charge, an invoice, is paid, and the revenue is posted to the ledger.

### Phase 5 — Advanced Clinical (Weeks 25–30)

Emergency/Triage, ICU, Surgery, Ambulance, Telemedicine, HR.

**Milestone:** Emergency admission, ICU transfer, surgical scheduling, and telemedicine consultation all functional.

### Phase 6 — AI & Analytics (Weeks 31–36)

AI Module (medical scribe, drug interactions, clinical summaries, risk scores), Analytics dashboards, Disease surveillance, Inventory forecasting.

**Milestone:** AI-assisted SOAP note generation and real-time KPI dashboards live.

### Phase 7 — Enterprise Integrations (Weeks 37–42)

FHIR R4 endpoints, HL7 v2 MLLP listener, National ID verification, Payment gateway expansion, Wearables hook, NHIF claims.

**Milestone:** FHIR compliant. Lab analyzers integrated via HL7. External systems can exchange data.

---

## 20. Open Questions & Risks

| # | Question / Risk | Priority | Owner |
|---|---|---|---|
| 1 | PACS vendor selection — which PACS system(s) must be integrated with for DICOM viewer? | High | Product |
| 2 | Payment gateways — which Ethiopian providers are in scope? (Telebirr, CBE Birr, Chapa?) | High | Product |
| 3 | SMS provider — preferred for Ethiopia (Africa's Talking vs. local SMPP)? | Medium | DevOps |
| 4 | LLM data residency — can PHI be sent to external LLM APIs, or must on-premise LLM be used? | Critical | Legal |
| 5 | NHIF integration — does a formal API spec exist for claims submission? | High | Partnerships |
| 6 | Video provider for Telemedicine — Daily.co, Twilio, or Jitsi (self-hosted)? | Medium | Product |
| 7 | Biometric attendance — which hardware device families must HR module support? | Low | HR |
| 8 | Data backup location — on-premise only, or cloud backup allowed? | High | Legal |
| 9 | Multi-hospital launch — is v1 single-hospital or multi-hospital from day one? | Critical | Product |
| 10 | Offline mode — must any module support offline operation (poor connectivity wards)? | Medium | Product |

---

*This document is a living specification. All changes must go through the Engineering Review process and be version-controlled alongside the codebase in /docs/srs.md.*
