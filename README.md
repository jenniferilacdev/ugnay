# UGNAY

**Integrated Local Government Information, Operations & Resident Services Platform**

UGNAY (Filipino for *connection / linkage*) connects LGUs → Barangays → Puroks →
Households → Residents → Public Services through Information, Services, Operations,
Communication, and Intelligence.

This repository is being built incrementally following the phased plan in the product
specification. **Current status: Phase 1 — Tenant, Organizations & Identity (complete).**

---

## Architecture

A **modular monolith**: one deployable API, organized around business capabilities,
designed to scale later without premature infrastructure.

```
frontend/  Next.js 16 · React 19 · TypeScript · Tailwind v4 · TanStack Query
   │  (calls the API only — never holds authoritative business rules)
   ▼
backend/   ASP.NET Core (.NET 10) — the authoritative business layer
   ├── Ugnay.Domain          entities, value objects (no dependencies)
   ├── Ugnay.Application      use cases, interfaces (depends on Domain)
   ├── Ugnay.Infrastructure   EF Core, PostgreSQL, persistence
   └── Ugnay.Api              REST endpoints, DI composition, health checks
   ▼
PostgreSQL 17  (via Docker Compose)
```

Dependency direction: `Api → Infrastructure → Application → Domain`.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)

## Getting started

**1. Start infrastructure (PostgreSQL + Adminer):**

```bash
cp .env.example .env        # optional: adjust ports / credentials
docker compose up -d
```

- PostgreSQL → `localhost:5432`
- Adminer (DB UI) → http://localhost:8080 (system: PostgreSQL, server: `postgres`)

**2. Run the API** (applies EF migrations automatically in Development):

```bash
cd backend/src/Ugnay.Api
dotnet run
```

- API → http://localhost:5295
- Health (readiness, checks DB) → http://localhost:5295/health/ready
- OpenAPI document → http://localhost:5295/openapi/v1.json

**3. Run the frontend:**

```bash
cd frontend
cp .env.example .env.local   # points at http://localhost:5295
npm install
npm run dev
```

- App → http://localhost:3002 (shows live API + tenant connectivity)

## Database migrations

Migrations run via the Infrastructure design-time factory, so the API does **not**
need to be stopped:

```bash
cd backend
# add a migration
dotnet ef migrations add <Name> \
  --project src/Ugnay.Infrastructure --startup-project src/Ugnay.Infrastructure \
  --output-dir Persistence/Migrations
# apply migrations
dotnet ef database update \
  --project src/Ugnay.Infrastructure --startup-project src/Ugnay.Infrastructure
```

The Development API also applies pending migrations on startup. Production applies
them as an explicit, separate deploy step.

## What Phase 0 includes

- Docker Compose (PostgreSQL 17 + Adminer)
- .NET 10 modular monolith with four layers and Clean-Architecture dependencies
- EF Core + Npgsql, snake_case naming, UUID keys, UTC audit timestamps, xmin concurrency
- Initial migration (`tenants` — the root of the multi-tenant hierarchy)
- Serilog structured logging, ProblemDetails error handling (no stack-trace leakage)
- Liveness/readiness health checks (readiness pings PostgreSQL)
- OpenAPI, CORS for the frontend
- Next.js app with a typed API client and TanStack Query data layer

## Phase 1 includes (complete)

- **Organizations & Puroks** — generalized City/Municipality → Barangay hierarchy,
  per-org settings, puroks (spec §7, §35).
- **Identity & Authorization** — ASP.NET Core Identity (cookie auth), permission
  catalog + role templates + organization scope, seeded super admin, login/logout/me
  with CSRF, permission-based policies (spec §15–29).
- **Audit foundation** — `AuditLog` with an EF interceptor (auto-audits entity
  changes) and explicit writer (auth events); `audit.view`-gated read API (spec §74).
- **Public portals** — dynamic, unauthenticated `/{lgu}` and `/{lgu}/{barangay}`
  routes resolving slug → organization, public information only (spec §9–10, §92).
- **Frontend** — shadcn/ui, dedicated `/login`, inset-sidebar dashboard, auth guard.

## Phase 2 includes (complete) — People Registry

- **Officials** — `Official` + `OfficialTerm` (positions/terms preserve
  administrations, spec §36).
- **Residents** — registry with verification statuses (§13), residency history &
  transfer (§14), safe reference numbering (§41), sensitive-field gating (§25/§92).
- **Households** — `Household` + `HouseholdMember` (relationships, head, status),
  add/remove/change-head preserving history (§33–34).
- **Registration & linking** — public self-registration from barangay portals →
  resident-match suggestions → staff approve (create/link resident) or reject;
  account↔resident link schema (§11–12).
- All writes CSRF-protected, organization-scope enforced, and audited with the actor.

## Roadmap (next)

- **Phase 3** — Reusable workflow foundation (requests, approval workflow, tasks,
  internal notes, activity timelines, notifications) before the service modules.
- Later phases per the product specification (certificates, programs, assets,
  communications, reports, intelligence).

> Configurable · Secure · Auditable · Historical · Connected · Resident-centered.
