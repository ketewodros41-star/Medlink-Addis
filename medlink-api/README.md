# MedLink Addis API

NestJS backend for the MedLink Addis hospital operating system.

## Current Scope

This backend scaffold implements the platform foundation from `spec.md`:

- Config validation
- PostgreSQL TypeORM wiring
- Redis provider
- Global validation pipe
- Standard response envelope
- Global exception filter
- Request ID middleware
- Health endpoints
- Auth, users, roles, permissions foundation
- Tenant-aware base entity

It is not a complete hospital backend yet. The next step is implementing domain workflows module by module.

## Setup

```bash
npm install
cp .env.example .env
npm run start:dev
```

## Endpoints

- `GET /health/live`
- `GET /health/ready`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `GET /api/v1/permissions`
- `GET /api/v1/patients`
- `POST /api/v1/patients`

## Security Note

Swagger is intentionally not enabled in this first scaffold because the current dependency audit reports a transitive `js-yaml` advisory through `@nestjs/swagger`. Reintroduce OpenAPI after selecting an audited package version or generating docs out of process.
