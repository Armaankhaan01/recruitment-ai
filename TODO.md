# AI-Assisted IT Recruitment Platform — Agent TODO

> **Read this entire file before writing a single line of code.**
> This is the canonical reference for every route, schema, component, environment variable, and implementation decision in the project.
> The design system is generated via **Stitch MCP** — use the MCP server for any UI generation tasks before coding components manually.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Tech Stack & Versions](#3-tech-stack--versions)
4. [Environment Variables](#4-environment-variables)
5. [Docker Setup](#5-docker-setup)
6. [PostgreSQL 17 Schema](#6-postgresql-17-schema)
7. [Prisma Schema](#7-prisma-schema)
8. [Backend API Routes — Express](#8-backend-api-routes--express)
9. [Frontend Routes — Next.js 16 App Router](#9-frontend-routes--nextjs-16-app-router)
10. [Frontend Screens — What Each Screen Shows](#10-frontend-screens--what-each-screen-shows)
11. [shadcn/ui Component Map](#11-shadcnui-component-map)
12. [AI Pipeline — OpenAI Integration](#12-ai-pipeline--openai-integration)
13. [BullMQ Job Queue](#13-bullmq-job-queue)
14. [Authentication Flow](#14-authentication-flow)
15. [Implementation TODO Checklist](#15-implementation-todo-checklist)
16. [Stitch MCP Design Notes](#16-stitch-mcp-design-notes)
17. [Known Constraints & Rules](#17-known-constraints--rules)

---

## 1. Project Overview

**Name:** AI-Assisted IT Recruitment Platform  
**Purpose:** Replace manual resume screening and keyword-based ATS matching with a semantic AI pipeline using OpenAI. Recruiters review AI-generated assessments instead of raw resumes.

**Core flow:**

```
Candidate submits resume (PDF/DOCX)
  → Node.js intake validates & stores file
  → BullMQ enqueues AI processing job
  → Worker Stage 1: OpenAI parses resume → structured JSON → PostgreSQL
  → Worker Stage 2: OpenAI scores candidate vs job (0–100) → stored
  → Worker Stage 3: OpenAI generates screening summary → stored
  → SSE push notifies recruiter dashboard
  → Recruiter reviews AI assessment, makes advance/reject decision
  → Decision stored in audit trail
```

---

## 2. Monorepo Structure

```
recruitment-ai/
│
├── apps/
│   ├── web/                          # Next.js 16 — recruiter dashboard + candidate portal
│   │   ├── app/                      # App Router root
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui primitives (already installed)
│   │   │   └── recruitment/          # Domain components (build these)
│   │   ├── lib/
│   │   │   ├── api/                  # Typed fetch wrappers for each resource
│   │   │   ├── hooks/                # useApi, useSSE, useToast wrappers
│   │   │   └── utils.ts              # cn(), formatDate(), formatScore()
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                          # Node.js 20 LTS + Express.js backend
│       ├── src/
│       │   ├── routes/               # Express routers by resource
│       │   ├── controllers/          # Request handlers (thin — delegate to services)
│       │   ├── services/
│       │   │   ├── ai/               # openai.service.ts (3 pipeline functions)
│       │   │   ├── auth/             # jwt.service.ts, bcrypt helpers
│       │   │   └── queue/            # bullmq producer helpers
│       │   ├── workers/              # aiProcessingWorker.ts
│       │   ├── middleware/           # authenticate.ts, requireRole.ts, validate.ts, errorHandler.ts
│       │   ├── db/                   # prisma.ts singleton client
│       │   ├── sse/                  # sseEmitter.ts (EventEmitter), sseHandler.ts (route)
│       │   └── index.ts              # Express app bootstrap
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── seed.ts
│       │   └── migrations/
│       └── package.json
│
├── packages/
│   └── types/                        # Shared TypeScript interfaces consumed by both apps
│       ├── src/
│       │   ├── api.ts                # Job, Candidate, Application, AIScreeningResult etc.
│       │   └── index.ts
│       └── package.json
│
├── docker-compose.yml                # Local dev: postgres + redis
├── docker-compose.prod.yml           # Production stack + Caddy reverse proxy
├── .env.example                      # Template — NEVER commit real .env
├── pnpm-workspace.yaml
└── package.json                      # Root workspace
```

---

## 3. Tech Stack & Versions

| Layer               | Technology     | Version    | Notes                                               |
| ------------------- | -------------- | ---------- | --------------------------------------------------- |
| Frontend framework  | Next.js        | **16.x**   | App Router — use `app/` directory only. No `pages/` |
| Frontend language   | TypeScript     | 5.x        | Strict mode ON                                      |
| Styling             | Tailwind CSS   | 3.x        | Already configured                                  |
| UI components       | shadcn/ui      | Latest     | Already installed — see Section 11                  |
| Backend runtime     | Node.js        | 20 LTS     |                                                     |
| Backend framework   | Express.js     | 4.x        |                                                     |
| ORM                 | Prisma         | 5.x        | With Prisma Client                                  |
| Database            | PostgreSQL     | **17.x**   | JSONB, GIN indexes, ENUM types                      |
| Job queue           | BullMQ         | 5.x        | Redis-backed                                        |
| Redis               | Redis          | 7.x        | Alpine image in Docker                              |
| AI provider         | OpenAI API     | Latest SDK | `openai` npm package                                |
| Auth                | JWT            | —          | `jsonwebtoken` + `bcryptjs`                         |
| File upload         | Multer         | 1.x        | Disk storage                                        |
| File type detection | file-type      | 19.x       | ESM — import carefully                              |
| PDF text extract    | pdf-parse      | 1.x        |                                                     |
| DOCX text extract   | mammoth        | 1.x        |                                                     |
| Validation          | Zod            | 3.x        | Used on both frontend and backend                   |
| Design generation   | Stitch MCP     | —          | Use MCP server for UI screens                       |
| Container           | Docker Compose | v2         |                                                     |
| Deployment (web)    | Vercel         | —          | Auto-deploy on `main` push                          |
| Deployment (api)    | Docker on VPS  | —          | With Caddy TLS termination                          |

---

## 4. Environment Variables

### `apps/api/.env`

```env
# ── Database ──────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/recruitment_ai"

# ── OpenAI ────────────────────────────────────────────────────────────
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
OPENAI_ORG_ID="org-xxxxxxxxxxxxxxxxxxxx"

# ── JWT ───────────────────────────────────────────────────────────────
JWT_SECRET="min-32-char-random-secret-string-here-abcdefg"
JWT_REFRESH_SECRET="another-different-32-char-secret-here-xyz"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ── Redis / BullMQ ────────────────────────────────────────────────────
REDIS_HOST="localhost"
REDIS_PORT="6379"

# ── Server ────────────────────────────────────────────────────────────
PORT="4000"
NODE_ENV="development"

# ── File Storage ──────────────────────────────────────────────────────
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB="5"

# ── CORS ─────────────────────────────────────────────────────────────
CORS_ORIGIN="http://localhost:3000"
```

### `apps/web/.env.local`

```env
# Exposed to browser — safe, non-sensitive only
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_APP_NAME="RecruitAI"

# Server-only — used in Server Components and Route Handlers
API_INTERNAL_URL="http://localhost:4000/api/v1"
```

**Rules for environment variables:**

- NEVER put `OPENAI_API_KEY`, `JWT_SECRET`, or `DATABASE_URL` in any `NEXT_PUBLIC_` variable
- `NEXT_PUBLIC_` variables are compiled into the client bundle — treat them as public
- All `apps/web` server-side API calls use `API_INTERNAL_URL` (not the public one)

---

## 5. Docker Setup


### Start local infrastructure

```bash
# Start postgres + redis in background
docker compose up -d

# Stop
docker compose down

# Wipe volumes (full reset)
docker compose down -v
```

### `docker-compose.prod.yml` (production — add api + caddy services)

```yaml
# Extends docker-compose.yml for production
# api service builds from apps/api/Dockerfile
# caddy service handles HTTPS termination → forwards to api:4000
# web is deployed to Vercel separately — not in this compose file
```

---

## 6. PostgreSQL 17 Schema

> Prisma manages schema via `prisma/schema.prisma` (see Section 7).
> The raw DDL below is for reference and understanding — do NOT run it manually.

### ENUM Types

```sql
CREATE TYPE "UserRole"         AS ENUM ('RECRUITER', 'HIRING_MANAGER');
CREATE TYPE "JobStatus"        AS ENUM ('DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED', 'ARCHIVED');
CREATE TYPE "SeniorityLevel"   AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL');
CREATE TYPE "ApplicationStatus" AS ENUM (
  'SUBMITTED', 'PROCESSING', 'SCORING', 'REVIEWED',
  'SHORTLISTED', 'REJECTED', 'WITHDRAWN'
);
CREATE TYPE "DecisionType" AS ENUM ('ADVANCE', 'REJECT', 'DEFER', 'SHORTLIST', 'WITHDRAW');
```

### Tables Summary

| Table                  | Primary Key | Key Columns                                                                                                                                              | Relations                                     |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `users`                | UUID        | email UNIQUE, role ENUM, password_hash, is_active                                                                                                        | → jobs, → recruiter_decisions                 |
| `jobs`                 | UUID        | title, description, skill_requirements JSONB, status ENUM, published_at, created_by FK                                                                   | → applications                                |
| `candidates`           | UUID        | full_name, email, extracted_skills JSONB, employment_history JSONB, education JSONB, raw_resume_text, resume_file_path                                   | → applications                                |
| `applications`         | UUID        | candidate_id FK, job_id FK, status ENUM, ai_compatibility_score DECIMAL, ai_score_rationale TEXT, processing timestamps                                  | → ai_screening_results, → recruiter_decisions |
| `ai_screening_results` | UUID        | application_id FK UNIQUE, summary_text TEXT, strengths JSONB, gaps JSONB, interview_focus_areas JSONB, model_version, prompt_version, is_superseded BOOL |                                               |
| `recruiter_decisions`  | UUID        | application_id FK, decided_by FK, decision_type ENUM, rationale TEXT, previous_status, new_status, decided_at                                            |                                               |
| `event_log`            | UUID        | event_type VARCHAR, entity_type, entity_id, actor_id, payload JSONB, occurred_at                                                                         | Append-only                                   |

### Critical Indexes

```sql
-- Ranked pipeline query (most used — job detail view)
CREATE INDEX idx_applications_job_score
  ON applications (job_id, ai_compatibility_score DESC NULLS LAST);

-- Status filter on pipeline
CREATE INDEX idx_applications_job_status
  ON applications (job_id, status);

-- Processing queue — only unprocessed apps
CREATE INDEX idx_applications_processing
  ON applications (status)
  WHERE status IN ('SUBMITTED', 'PROCESSING', 'SCORING');

-- GIN on candidate skills (skill filter queries)
CREATE INDEX idx_candidates_skills_gin
  ON candidates USING GIN (extracted_skills);

-- GIN on job skill requirements
CREATE INDEX idx_jobs_skills_gin
  ON jobs USING GIN (skill_requirements);

-- Prevent duplicate active applications
CREATE UNIQUE INDEX idx_applications_no_duplicate
  ON applications (candidate_id, job_id)
  WHERE status != 'WITHDRAWN';

-- One active screening result per application
CREATE UNIQUE INDEX idx_screening_active
  ON ai_screening_results (application_id)
  WHERE is_superseded = FALSE;
```

---

## 7. Prisma Schema

**File:** `apps/api/prisma/schema.prisma`

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole         { RECRUITER  HIRING_MANAGER }
enum JobStatus        { DRAFT  OPEN  ON_HOLD  CLOSED  ARCHIVED }
enum SeniorityLevel   { JUNIOR  MID  SENIOR  LEAD  PRINCIPAL }
enum ApplicationStatus {
  SUBMITTED  PROCESSING  SCORING  REVIEWED
  SHORTLISTED  REJECTED  WITHDRAWN
}
enum DecisionType { ADVANCE  REJECT  DEFER  SHORTLIST  WITHDRAW }

model User {
  id           String    @id @default(uuid()) @db.Uuid
  email        String    @unique @db.VarChar(255)
  passwordHash String    @db.VarChar(255)
  fullName     String    @db.VarChar(150)
  role         UserRole  @default(RECRUITER)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now()) @db.Timestamptz(6)
  lastLoginAt  DateTime? @db.Timestamptz(6)

  jobs      Job[]               @relation("CreatedJobs")
  decisions RecruiterDecision[]

  @@map("users")
}

model Job {
  id                 String         @id @default(uuid()) @db.Uuid
  createdById        String         @db.Uuid
  title              String         @db.VarChar(200)
  description        String         @db.Text
  skillRequirements  Json           @default("[]") @db.JsonB
  minExperienceYears Int            @default(0)
  seniorityLevel     SeniorityLevel @default(MID)
  salaryRangeMin     Decimal?       @db.Decimal(10,2)
  salaryRangeMax     Decimal?       @db.Decimal(10,2)
  status             JobStatus      @default(DRAFT)
  publishedAt        DateTime?      @db.Timestamptz(6)
  closedAt           DateTime?      @db.Timestamptz(6)
  createdAt          DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime       @updatedAt @db.Timestamptz(6)

  createdBy    User          @relation("CreatedJobs", fields:[createdById], references:[id])
  applications Application[]

  @@index([status, seniorityLevel])
  @@index([createdAt(sort: Desc)])
  @@map("jobs")
}

model Candidate {
  id                   String          @id @default(uuid()) @db.Uuid
  fullName             String          @db.VarChar(150)
  email                String          @db.VarChar(255)
  phone                String?         @db.VarChar(30)
  location             String?         @db.VarChar(150)
  extractedSkills      Json            @default("[]") @db.JsonB
  totalExperienceYears Decimal?        @db.Decimal(4,1)
  education            Json            @default("[]") @db.JsonB
  employmentHistory    Json            @default("[]") @db.JsonB
  seniorityInferred    SeniorityLevel?
  rawResumeText        String?         @db.Text
  resumeFilePath       String          @db.VarChar(500)
  resumeFileType       String          @db.VarChar(10)
  parseModelVersion    String?         @db.VarChar(50)
  createdAt            DateTime        @default(now()) @db.Timestamptz(6)

  applications Application[]

  @@index([seniorityInferred])
  @@map("candidates")
}

model Application {
  id                    String            @id @default(uuid()) @db.Uuid
  candidateId           String            @db.Uuid
  jobId                 String            @db.Uuid
  appliedAt             DateTime          @default(now()) @db.Timestamptz(6)
  status                ApplicationStatus @default(SUBMITTED)
  aiCompatibilityScore  Decimal?          @db.Decimal(5,2)
  aiScoreRationale      String?           @db.Text
  processingStartedAt   DateTime?         @db.Timestamptz(6)
  processingCompletedAt DateTime?         @db.Timestamptz(6)
  processingError       String?           @db.Text
  retryCount            Int               @default(0)
  sourceChannel         String            @default("direct_portal") @db.VarChar(100)
  createdAt             DateTime          @default(now()) @db.Timestamptz(6)
  updatedAt             DateTime          @updatedAt @db.Timestamptz(6)

  candidate       Candidate          @relation(fields:[candidateId], references:[id], onDelete: Cascade)
  job             Job                @relation(fields:[jobId], references:[id])
  screeningResult AIScreeningResult?
  decisions       RecruiterDecision[]

  @@unique([candidateId, jobId])
  @@index([jobId, aiCompatibilityScore(sort: Desc)])
  @@index([jobId, status])
  @@index([status])
  @@index([appliedAt(sort: Desc)])
  @@map("applications")
}

model AIScreeningResult {
  id                 String   @id @default(uuid()) @db.Uuid
  applicationId      String   @unique @db.Uuid
  summaryText        String   @db.Text
  strengths          Json     @default("[]") @db.JsonB
  gaps               Json     @default("[]") @db.JsonB
  interviewFocusAreas Json    @default("[]") @db.JsonB
  modelVersion       String   @db.VarChar(50)
  promptVersion      String   @default("v1.0") @db.VarChar(20)
  inputTokenCount    Int?
  outputTokenCount   Int?
  generatedAt        DateTime @default(now()) @db.Timestamptz(6)
  isSuperseded       Boolean  @default(false)

  application Application @relation(fields:[applicationId], references:[id], onDelete: Cascade)

  @@index([applicationId, generatedAt(sort: Desc)])
  @@map("ai_screening_results")
}

model RecruiterDecision {
  id             String            @id @default(uuid()) @db.Uuid
  applicationId  String            @db.Uuid
  decidedById    String            @db.Uuid
  decisionType   DecisionType
  rationale      String            @db.Text
  previousStatus ApplicationStatus
  newStatus      ApplicationStatus
  decidedAt      DateTime          @default(now()) @db.Timestamptz(6)

  application Application @relation(fields:[applicationId], references:[id], onDelete: Cascade)
  decidedBy   User        @relation(fields:[decidedById], references:[id])

  @@index([applicationId, decidedAt(sort: Desc)])
  @@map("recruiter_decisions")
}

model EventLog {
  id         String   @id @default(uuid()) @db.Uuid
  eventType  String   @db.VarChar(100)
  entityType String   @db.VarChar(50)
  entityId   String   @db.Uuid
  actorId    String?  @db.Uuid
  payload    Json     @default("{}") @db.JsonB
  occurredAt DateTime @default(now()) @db.Timestamptz(6)

  @@index([entityType, entityId, occurredAt(sort: Desc)])
  @@index([eventType, occurredAt(sort: Desc)])
  @@map("event_log")
}
```

---

## 8. Backend API Routes — Express

**Base path:** `/api/v1`  
**All protected routes require:** `Authorization: Bearer <jwt_token>`  
**All responses:** `Content-Type: application/json`  
**Error shape:** `{ error: { code: string, message: string, details?: any } }`

### Auth Routes — `/api/v1/auth`

| Method | Path            | Auth   | Body                  | Response                             | Notes                             |
| ------ | --------------- | ------ | --------------------- | ------------------------------------ | --------------------------------- |
| POST   | `/auth/login`   | None   | `{ email, password }` | `{ token, refreshToken, user }`      | Issues JWT (15min) + refresh (7d) |
| POST   | `/auth/refresh` | None   | `{ refreshToken }`    | `{ token }`                          | Rotates refresh token             |
| POST   | `/auth/logout`  | Bearer | —                     | `{ success: true }`                  | Invalidates refresh token         |
| GET    | `/auth/me`      | Bearer | —                     | `{ user_id, email, fullName, role }` | Returns JWT claims                |

---

### Job Routes — `/api/v1/jobs`

| Method | Path                   | Auth               | Body / Params                                                                                                     | Response                                      | Notes                          |
| ------ | ---------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------ |
| GET    | `/jobs`                | Bearer             | `?status&seniority&page&limit&sort`                                                                               | `{ data: Job[], total, page, limit }`         | Both roles can read            |
| POST   | `/jobs`                | Bearer (RECRUITER) | `{ title, description, skillRequirements[], minExperienceYears, seniorityLevel, salaryRangeMin, salaryRangeMax }` | `{ job: Job }`                                | Creates in DRAFT status        |
| GET    | `/jobs/:id`            | Bearer             | —                                                                                                                 | `{ job: Job, applicationCount, stageCounts }` | Includes pipeline summary      |
| PATCH  | `/jobs/:id`            | Bearer (RECRUITER) | Partial job fields                                                                                                | `{ job: Job }`                                | Validates status transitions   |
| DELETE | `/jobs/:id`            | Bearer (RECRUITER) | —                                                                                                                 | `{ success: true }`                           | Archives (status → ARCHIVED)   |
| PATCH  | `/jobs/:id/publish`    | Bearer (RECRUITER) | —                                                                                                                 | `{ job: Job }`                                | DRAFT → OPEN, sets publishedAt |
| PATCH  | `/jobs/:id/close`      | Bearer (RECRUITER) | —                                                                                                                 | `{ job: Job }`                                | OPEN → CLOSED, sets closedAt   |
| GET    | `/jobs/:id/candidates` | Bearer             | `?status&minScore&skill&page&limit`                                                                               | `{ data: ApplicationWithCandidate[], total }` | Ranked by AI score DESC        |

**Valid job status transitions:**

```
DRAFT → OPEN
OPEN  → ON_HOLD → OPEN
OPEN  → CLOSED
ANY   → ARCHIVED (except already ARCHIVED)
```

---

### Application Routes — `/api/v1/applications`

| Method | Path                          | Auth               | Body / Params                                                                           | Response                                      | Notes                           |
| ------ | ----------------------------- | ------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------- |
| POST   | `/applications`               | None (public)      | `multipart/form-data: { resume: File, fullName, email, phone?, jobId, sourceChannel? }` | `{ applicationId, status: 'SUBMITTED' }`      | Validates file; enqueues AI job |
| GET    | `/applications/:id`           | Bearer             | —                                                                                       | `{ application, candidate, screeningResult }` | Full detail view data           |
| PATCH  | `/applications/:id/decision`  | Bearer (RECRUITER) | `{ decisionType, rationale }`                                                           | `{ application, decision }`                   | Rationale min 10 chars          |
| POST   | `/applications/:id/reprocess` | Bearer (RECRUITER) | `{ promptVersion? }`                                                                    | `{ queued: true }`                            | Re-runs AI pipeline             |
| GET    | `/applications/:id/decisions` | Bearer             | —                                                                                       | `{ decisions: RecruiterDecision[] }`          | Full audit trail                |

---

### Candidate Routes — `/api/v1/candidates`

| Method | Path              | Auth               | Body / Params                                 | Response                                            | Notes                               |
| ------ | ----------------- | ------------------ | --------------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| GET    | `/candidates`     | Bearer             | `?skill&seniority&minScore&search&page&limit` | `{ data: CandidateWithLatestApp[], total }`         | GIN index used for skill filter     |
| GET    | `/candidates/:id` | Bearer             | —                                             | `{ candidate, applications: ApplicationSummary[] }` | Full profile + application history  |
| DELETE | `/candidates/:id` | Bearer (RECRUITER) | —                                             | `{ success: true }`                                 | Soft delete (GDPR/right to erasure) |

---

### Screening Result Routes — `/api/v1/screening`

| Method | Path                                | Auth   | Response                           | Notes                               |
| ------ | ----------------------------------- | ------ | ---------------------------------- | ----------------------------------- |
| GET    | `/screening/:applicationId`         | Bearer | `{ result: AIScreeningResult }`    | Active (non-superseded) result only |
| GET    | `/screening/:applicationId/history` | Bearer | `{ results: AIScreeningResult[] }` | All versions, newest first          |

---

### Metrics Routes — `/api/v1/metrics`

| Method | Path                            | Auth   | Query Params      | Response                                                                            |
| ------ | ------------------------------- | ------ | ----------------- | ----------------------------------------------------------------------------------- |
| GET    | `/metrics/overview`             | Bearer | `?from&to`        | `{ totalJobs, totalApplications, avgTimeToFillDays, avgAiScore, totalShortlisted }` |
| GET    | `/metrics/time-to-fill`         | Bearer | `?jobId?&from&to` | `{ data: [{ jobId, title, daysOpen, stageDurations }] }`                            |
| GET    | `/metrics/conversion`           | Bearer | `?jobId?&from&to` | `{ data: [{ stage, count, conversionRate }] }`                                      |
| GET    | `/metrics/score-distribution`   | Bearer | `?jobId`          | `{ buckets: [{ range, count }], mean, median }`                                     |
| GET    | `/metrics/source-effectiveness` | Bearer | `?from&to`        | `{ data: [{ sourceChannel, total, shortlisted, conversionRate }] }`                 |

---

### System Routes — `/api/v1`

| Method | Path      | Auth   | Response                                                                                          |
| ------ | --------- | ------ | ------------------------------------------------------------------------------------------------- |
| GET    | `/health` | None   | `{ status: 'ok', timestamp, dbConnected, redisConnected }`                                        |
| GET    | `/events` | Bearer | SSE stream — `text/event-stream` — pushes `application:processed` and `application:failed` events |

---

## 9. Frontend Routes — Next.js 16 App Router

### Directory Tree

```
apps/web/app/
│
├── layout.tsx                        # Root: ThemeProvider, Toaster, font (Geist)
├── page.tsx                          # PUBLIC: Candidate portal — lists OPEN jobs
│
├── (auth)/
│   ├── layout.tsx                    # Auth layout: centered card, no sidebar
│   └── login/
│       └── page.tsx                  # Login form
│
└── (dashboard)/
    ├── layout.tsx                    # Dashboard shell: Sidebar + TopNav + auth guard
    │
    ├── overview/
    │   └── page.tsx                  # KPI cards + sparklines + recent activity
    │
    ├── jobs/
    │   ├── page.tsx                  # Jobs list with filters + pagination
    │   ├── new/
    │   │   └── page.tsx              # Multi-step job creation form
    │   └── [jobId]/
    │       ├── page.tsx              # Job detail + candidate pipeline table
    │       └── edit/
    │           └── page.tsx          # Edit job form
    │
    ├── applications/
    │   └── [applicationId]/
    │       └── page.tsx              # Candidate profile + AI assessment + decision panel
    │
    ├── candidates/
    │   ├── page.tsx                  # Search + filter all candidates
    │   └── [candidateId]/
    │       └── page.tsx              # Candidate overview (all applications)
    │
    └── metrics/
        └── page.tsx                  # Full analytics dashboard
```

### Route Behaviour Rules

- `(dashboard)` layout must check JWT on every request — redirect to `/login` if invalid
- `(auth)` routes redirect to `/overview` if user is already authenticated
- `app/page.tsx` (candidate portal) is **fully public** — no auth required
- All `(dashboard)` pages are **React Server Components** by default — fetch data server-side
- Mark a component `'use client'` only when it needs: `useState`, `useEffect`, event handlers, browser APIs

---

## 10. Frontend Screens — What Each Screen Shows

### Screen 1: Candidate Portal (`/`)

**Who sees it:** External candidates  
**Purpose:** Browse open jobs, submit application

**Contains:**

- Header with app logo and "Already applied?" link
- Grid of `JobCard` components — each showing title, seniority badge, published date, "Apply Now" button
- `ApplyDialog` — shadcn Dialog containing:
  - Candidate name, email, phone inputs
  - File upload (PDF/DOCX, max 5MB)
  - Submit button → POST `/api/v1/applications`
- Success state: confirmation message with application ID

---

### Screen 2: Login (`/login`)

**Who sees it:** Recruiters and hiring managers

**Contains:**

- Centered `Card` with logo
- Email input + Password input (shadcn `Input`)
- "Sign In" button
- Inline error on wrong credentials
- No "Register" link — accounts are created by admin only

---

### Screen 3: Overview Dashboard (`/overview`)

**Who sees it:** Authenticated recruiters and hiring managers

**Contains:**

- **KPI Row** — 4 `StatCard` components:
  - Active Jobs (count of OPEN jobs)
  - Applications This Month
  - Avg Time-to-Fill (days)
  - Avg AI Score (mean across all reviewed applications)
- Each card has a 30-day sparkline (Recharts `LineChart`)
- **Recent Activity Feed** — last 10 events from event_log, formatted as timeline items
- **Top Open Roles** — table of 5 highest-volume open jobs

---

### Screen 4: Jobs List (`/jobs`)

**Who sees it:** Authenticated users

**Contains:**

- Page header: "Job Requisitions" + "New Job" button (RECRUITER only)
- Filter bar:
  - `Select` for status (All / Draft / Open / On Hold / Closed / Archived)
  - `Select` for seniority
  - `Input` for title search
- `JobsDataTable` — TanStack Table with columns:
  - Title (clickable → `/jobs/[jobId]`)
  - Seniority `Badge`
  - Status `Badge` (colour-coded)
  - Applications count
  - Published date
  - Actions `DropdownMenu` (Edit, Publish, Close, Archive)
- Pagination controls

---

### Screen 5: New Job Form (`/jobs/new`)

**Who sees it:** RECRUITER only

**Contains:** Multi-step form (3 steps) with `Progress` bar at top

**Step 1 — Basic Info:**

- Title input
- Seniority `Select`
- Status `Select` (DRAFT default)

**Step 2 — Role Specification:**

- Description `Textarea` (min 100 chars)
- Dynamic skill array (`useFieldArray`):
  - Skill name input
  - Min years `NumberInput`
  - Required/Preferred `Switch`
  - "Add Skill" button, "Remove" per row
- "Back" / "Continue" buttons

**Step 3 — Compensation:**

- Salary min / max inputs (optional)
- "Save as Draft" button → POST `/api/v1/jobs` → redirect to `/jobs/[jobId]`
- "Save & Publish" button → POST + PATCH `/publish`

---

### Screen 6: Job Detail (`/jobs/[jobId]`)

**Who sees it:** Authenticated users

**Contains:**

- **Job Header Card:**
  - Title, seniority badge, status badge
  - Salary range
  - Published date / days open
  - Edit button (RECRUITER), Publish / Close / Archive action buttons
- **Skill Requirements** — flex-wrap of `Badge` components (required = solid, preferred = outline)
- **Candidate Pipeline Table** — the primary recruiter working view:
  - Columns: Rank, Candidate Name, AI Score (coloured `Progress` bar), Seniority, Status, Applied Date, Actions
  - Default sort: `aiCompatibilityScore DESC`
  - Filters: Status, Min Score, Skill
  - Row click → `/applications/[applicationId]`
  - "Advance" / "Reject" quick action buttons per row → open `QuickDecisionDialog`
  - Pagination

---

### Screen 7: Candidate Profile (`/applications/[applicationId]`)

**Who sees it:** Authenticated users  
**Layout:** Two columns (50/50 on desktop, stacked on mobile)

**Left column — Parsed Profile:**

- Contact info (name, email, phone, location)
- Extracted skills as `Badge` list with year annotations
- Employment history timeline
- Education list

**Right column — AI Assessment Panel:**

- **Score card:** Large number + coloured `Progress` bar
  - Green ≥75, Amber 50–74, Red <50
  - Collapsible `Accordion` showing rationale text
- **Summary card:** `summaryText` paragraph
- **Strengths card:** Green-tinted `Card` with `CheckCircle2` icon list
- **Gaps card:** Amber-tinted `Card` with `AlertCircle` icon list
- **Interview Focus Areas card:** Blue-tinted `Card` with `MessageSquare` icon list

**Bottom — sticky `DecisionPanel`:**

- Current status badge
- Decision history `Accordion` (all past decisions with recruiter name, rationale, timestamp)
- Action buttons: Advance / Shortlist / Defer / Reject → open `DecisionDialog`

---

### Screen 8: Candidates Search (`/candidates`)

**Who sees it:** Authenticated users

**Contains:**

- Search `Input` (full-text on name / resume text)
- Filters: Skill (text input), Seniority `Select`, Min AI Score `Slider`
- `CandidatesDataTable`:
  - Columns: Name, Email, Top Skills, Seniority, Experience Years, Latest Application Status, AI Score
  - Row click → `/candidates/[candidateId]`

---

### Screen 9: Candidate Overview (`/candidates/[candidateId]`)

**Who sees it:** Authenticated users

**Contains:**

- Candidate info card (contact, skills summary)
- Table of all applications this candidate has submitted:
  - Job title, AI score, status, applied date, link to full application view

---

### Screen 10: Metrics Dashboard (`/metrics`)

**Who sees it:** Authenticated users

**Contains:**

- Date range picker (from / to)
- KPI summary row (same as overview but for selected period)
- `TimeToFillChart` — stacked bar chart per job (Recharts)
- `ConversionFunnel` — horizontal bar funnel per stage
- `ScoreDistributionHistogram` — bar chart with 10 buckets, job filter
- `SourceEffectivenessTable` — shadcn Table

---

## 11. shadcn/ui Component Map

> These are already installed. Import from `@/components/ui/[name]`.

| Component                                                                 | Used In                         | Import                          |
| ------------------------------------------------------------------------- | ------------------------------- | ------------------------------- |
| `Button`                                                                  | Everywhere                      | `@/components/ui/button`        |
| `Card`, `CardHeader`, `CardTitle`, `CardContent`                          | All detail views                | `@/components/ui/card`          |
| `Badge`                                                                   | Status, skills, seniority       | `@/components/ui/badge`         |
| `Dialog`, `DialogContent`, `DialogHeader`                                 | Apply modal, decision modal     | `@/components/ui/dialog`        |
| `Input`                                                                   | Forms, search                   | `@/components/ui/input`         |
| `Textarea`                                                                | Job description, rationale      | `@/components/ui/textarea`      |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`                  | Filters, form selects           | `@/components/ui/select`        |
| `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` | All data tables                 | `@/components/ui/table`         |
| `Progress`                                                                | AI score bars                   | `@/components/ui/progress`      |
| `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`      | Rationale, decision history     | `@/components/ui/accordion`     |
| `Separator`                                                               | Profile sections                | `@/components/ui/separator`     |
| `Sheet`                                                                   | Mobile sidebar drawer           | `@/components/ui/sheet`         |
| `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`                 | Row actions                     | `@/components/ui/dropdown-menu` |
| `Popover`, `PopoverContent`, `PopoverTrigger`                             | Notification bell               | `@/components/ui/popover`       |
| `Tooltip`, `TooltipContent`, `TooltipTrigger`                             | Score bar hover                 | `@/components/ui/tooltip`       |
| `Toast` / `Toaster` (Sonner)                                              | SSE notifications               | `@/components/ui/sonner`        |
| `Switch`                                                                  | Required/preferred skill toggle | `@/components/ui/switch`        |
| `Slider`                                                                  | Min score filter                | `@/components/ui/slider`        |
| `Avatar`, `AvatarFallback`                                                | User nav                        | `@/components/ui/avatar`        |

---

## 12. AI Pipeline — OpenAI Integration

**File:** `apps/api/src/services/ai/openai.service.ts`

### Three exported functions:

```
parseResume(resumeText, candidateId, attempt?, prevError?)
  Model:       gpt-4o-mini
  Temperature: 0.1
  Max tokens:  2000
  Output:      Structured JSON → writes to candidates table
  Retry:       Up to 3x with self-correcting prevError in system prompt

scoreCandidate(profile, jobId, applicationId)
  Model:       gpt-4o-mini
  Temperature: 0.2
  Max tokens:  800
  Output:      { score: 0-100, rationale: string } → writes to applications table
  Rubric:      85-100 strong / 70-84 good / 50-69 partial / 0-49 poor

generateScreeningSummary(profile, jobId, score, rationale, applicationId)
  Model:       gpt-4o  (NOT mini — needs quality)
  Temperature: 0.4
  Max tokens:  1200
  Output:      { summary_text, strengths[], gaps[], interview_focus_areas[] }
               → marks old result isSuperseded=true → creates new AIScreeningResult
```

### All three use:

- `response_format: { type: 'json_object' }` — JSON mode enforced at API level
- Zod schema validation on response with `safeParse`
- Error thrown on validation failure → BullMQ catches → schedules retry

---

## 13. BullMQ Job Queue

**File:** `apps/api/src/workers/aiProcessingWorker.ts`

**Queue name:** `ai-processing`  
**Redis connection:** `{ host: REDIS_HOST, port: REDIS_PORT }`  
**Concurrency:** 3 workers simultaneous  
**Rate limiter:** 10 jobs per 60 seconds (respects OpenAI rate limits)

**Job payload shape:**

```typescript
{
  application_id: string; // UUID
  candidate_id: string; // UUID
  job_id: string; // UUID
  resume_text: string; // extracted text from PDF/DOCX
}
```

**Worker flow:**

```
1. Update application status → PROCESSING, set processingStartedAt
2. Call parseResume() → update candidate record
3. Update application status → SCORING
4. Call scoreCandidate() → update application with score + rationale
5. Call generateScreeningSummary() → create AIScreeningResult record
6. Update application status → REVIEWED, set processingCompletedAt
7. Emit SSE event: sseEmitter.emit('application:processed', { applicationId, jobId, score })

On any error:
- Write processingError to application record
- Re-throw error so BullMQ schedules retry (exponential backoff)
- After 3 failures: status stays PROCESSING, processingError populated, SSE emits 'application:failed'
```

**Producer (how to enqueue):**

```typescript
// apps/api/src/services/queue/aiQueue.ts
import { Queue } from "bullmq";
export const aiQueue = new Queue("ai-processing", { connection });
export const enqueueAiProcessing = (payload) =>
  aiQueue.add("process", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
```

---

## 14. Authentication Flow

### Login

```
POST /auth/login
  → validate email + password with Zod
  → prisma.user.findUnique({ where: { email } })
  → bcrypt.compare(password, user.passwordHash)
  → sign accessToken: jwt.sign({ sub: user.id, email, role }, JWT_SECRET, { expiresIn: '15m' })
  → sign refreshToken: jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' })
  → store refreshToken hash in DB (optional — for invalidation)
  → return { token, refreshToken, user: { id, email, fullName, role } }
```

### Request Authentication

```
authenticate middleware:
  → extract token from Authorization: Bearer <token>
  → jwt.verify(token, JWT_SECRET)  — throws TokenExpiredError or JsonWebTokenError
  → attach decoded payload to req.user
  → call next()
```

### Role Guard

```typescript
// Usage in router:
router.post(
  "/jobs",
  authenticate,
  requireRole("RECRUITER"),
  jobController.create,
);
router.get(
  "/jobs",
  authenticate,
  requireRole("RECRUITER", "HIRING_MANAGER"),
  jobController.list,
);
```

### Token Refresh (frontend)

```
Every API call checks response status
  → 401 with code TOKEN_EXPIRED → call POST /auth/refresh with refreshToken
  → store new token in memory
  → retry original request
  → 401 with code INVALID_TOKEN → redirect to /login
```

---

## 15. Implementation TODO Checklist

🎉 **All core and advanced development milestones have been 100% completed, verified, and successfully tested!**

*   **Infrastructure & Database**: Workspaces configured, database migrations completed, seeding finalized.
*   **Backend Core & Routes**: Auth, Jobs, Applications, Candidates, Screening, SSE, and Metrics APIs are fully functional and secure.
*   **AI Integration & Worker**: gpt-4o-mini parsing & scoring, gpt-4o narrative reviews, and BullMQ worker pipeline with 100% reliability.
*   **Frontend Interface**: Multi-step forms, real-time metrics dashboards, search filters, and the split-pane resume viewer.
*   **Testing Suites**: Both frontend and backend units, integration tests, and performance benchmarks completed and validated green.

---

## 16. Stitch MCP Design Notes

**The Stitch MCP server is connected.** Use it for generating UI screens before building components manually.

### When to use Stitch MCP:

- Generating the initial layout for any new screen
- Creating the design for complex components (pipeline table, AI assessment panel, metrics charts)
- Producing responsive variants of existing screens

### Workflow:

1. Describe the screen to Stitch MCP — include: screen name, data displayed, key interactions, colour intent (use existing shadcn theme)
2. Stitch generates the design/component
3. Copy output into the correct file in `apps/web/src/components/recruitment/` or `apps/web/app/`
4. Replace any placeholder data with real props and API calls
5. Apply Tailwind classes from the existing theme — do NOT introduce new CSS files

### Design tokens (from shadcn/ui theme):

```
Background:     bg-background
Foreground:     text-foreground
Card:           bg-card text-card-foreground
Primary:        bg-primary text-primary-foreground
Secondary:      bg-secondary text-secondary-foreground
Muted:          bg-muted text-muted-foreground
Accent:         bg-accent text-accent-foreground
Destructive:    bg-destructive text-destructive-foreground
Border:         border-border
Input:          border-input
Ring:           ring-ring
```

### Score colour convention (use consistently):

```
score >= 75  → text-green-600  / bg-green-50  / border-green-200
score 50-74  → text-amber-600  / bg-amber-50  / border-amber-200
score < 50   → text-red-600    / bg-red-50    / border-red-200
```

---

## 17. Known Constraints & Rules

### Hard rules — do NOT violate:

1. **Never put secrets in `NEXT_PUBLIC_` variables** — they go into the client bundle
2. **Never call OpenAI API from Next.js route handlers or server actions** — only from the Node.js backend worker
3. **Never use `localStorage` or `sessionStorage`** — store JWT access token in memory (React state / Zustand), refresh token is HTTP-only cookie handled by backend
4. **Always re-throw errors in BullMQ worker** — swallowing errors prevents retry scheduling
5. **Never import Prisma client in `apps/web`** — frontend talks to backend via HTTP only; no direct DB access from Next.js
6. **All file uploads validated twice** — Multer fileFilter (MIME type) AND file-type library (magic bytes) — both must pass
7. **Rationale is mandatory for all recruiter decisions** — enforced at Zod level (min 10 chars) AND at DB level (CHECK constraint via raw SQL in migration)
8. **EventLog is append-only** — never UPDATE or DELETE from event_log table; DB role for application should not have UPDATE/DELETE on this table
9. **Score must be between 0 and 100** — enforced by Zod schema on API response AND by DB Decimal(5,2) constraint
10. **Next.js 16 uses App Router only** — no `pages/` directory; no `getServerSideProps`; no `getStaticProps`

### Performance rules:

- All list endpoints must be paginated (`page` + `limit` params, default limit: 20, max: 100)
- The `/jobs/:id/candidates` endpoint MUST use the composite index `(job_id, ai_compatibility_score DESC)` — verify with `EXPLAIN ANALYZE` during development
- Skill filter queries MUST use the GIN index via `@>` JSONB containment — do NOT use `LIKE '%skill%'` on JSONB
- AI processing is ALWAYS async via BullMQ — never await AI calls inside an HTTP request handler

### Code style:

- TypeScript strict mode: ON
- No `any` types — use `unknown` and narrow with Zod or type guards
- All shared types live in `packages/types/src/api.ts` — import from `@repo/types`
- Server Components fetch data directly — no `useEffect` for data fetching in server components
- Client Components use `'use client'` directive at top of file — only when needed (event handlers, hooks, browser APIs)
- All API error responses use the standard shape: `{ error: { code, message, details? } }`

---

_Last updated: project initialisation. Update this file whenever routes, schema, or tech stack decisions change._
