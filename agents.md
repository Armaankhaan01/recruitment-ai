# AI-Assisted IT Recruitment Platform

## Project Overview

An AI-powered IT recruitment platform built with Next.js 16 (App Router), Node.js + Express.js, PostgreSQL, Redis + BullMQ, and the OpenAI API. The system automates resume screening through a three-stage AI pipeline: semantic resume parsing, compatibility scoring, and screening summary generation.use TODO.md file for looking what to build next. when you complete any task in TODO.md file mark it as completed in the TODO.md file.

## Architecture

```
recruitment-ai/
├─ apps/
│  ├─ web/              # Next.js 16 frontend (App Router, TypeScript, Tailwind CSS, shadcn/ui)
│  ├─ api/              # Node.js + Express.js REST backend (not yet scaffolded)
│  └─ workers/           # BullMQ worker processes for async AI pipeline (not yet scaffolded)
├─ packages/             # Shared packages (types, DB schema)
├─ scripts/              # Utility scripts, migrations, seeding
├─ .env, .env.example
└─ agents.md, TODO.md
```

## Core Modules

### 1. Authentication (JWT)

- JWT-based session tokens (15-min access, 7-day refresh)
- Role-based access control: `recruiter` vs `hiring_manager`
- Bcrypt password hashing, HTTP-only cookie storage

### 2. Job Management

- CRUD for job requisitions with status lifecycle: `draft → open → on_hold → closed → archived`
- Structured skill requirements stored as JSONB
- Seniority levels, experience thresholds, salary bands

### 3. Application Intake

- Public application portal for candidate resume submission (PDF/DOCX, max 5 MB)
- Multer file validation (MIME type + magic bytes)
- BullMQ queue decouples upload from AI processing

### 4. AI Processing Pipeline (Three Stages)

- **Stage 1 – parseResume:** OpenAI gpt-4o-mini extracts structured profile (skills, experience, education, employment history). Zod schema validation with self-correcting retry (up to 2 retries).
- **Stage 2 – scoreCandidate:** OpenAI gpt-4o-mini computes 0–100 semantic compatibility score across 4 dimensions: skill coverage, experience depth, seniority alignment, contextual relevance.
- **Stage 5 – generateScreeningSummary:** OpenAI gpt-4o produces narrative summary with strengths, gaps, and interview focus areas. Stored separately for versioning.

### 5. Pipeline Management

- Recruiters advance/reject/defer candidates with mandatory rationale (min 10 chars)
- Immutable audit trail in `recruiter_decisions` and `event_log` tables

### 6. Metrics Dashboard

- Time-to-fill, cost-per-hire, stage conversion rates, score distribution
- Source channel effectiveness analysis

### 7. Search & Filter

- Filter by AI score range, skill tags (JSONB containment via GIN index), seniority, status
- Full-text search across candidate profiles

### 8. Notifications

- Server-Sent Events (SSE) push processing-complete events to recruiter dashboard
- React Context + Toast for in-app notifications

## Database Access (PostgreSQL with native pg)

- Direct SQL queries using the `pg` library for Node.js.
- Connection managed via environment variables (`POSTGRES_URL` using Neon connection string).
- SQL migration scripts located in `scripts/sql/` executed with `psql` or a custom migration runner.
- Typed query helpers defined in `packages/db` for reuse across API and workers.
- No Prisma ORM; raw queries ensure full control and minimal overhead.

## API Endpoints

~30 endpoints across six resource domains under `/api/v1`:

- Auth: login, refresh, logout, me
- Jobs: CRUD, publish, candidates list
- Applications: submit (public), detail, decision, reprocess, decision history
- Candidates: search/filter, profile, erasure delete
- Screening: active result, version history
- Metrics: overview, time-to-fill, conversion funnel, score distribution, source effectiveness

## Technology Stack

| Layer       | Technology                                                                       |
| ----------- | -------------------------------------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui         |
| Backend     | Node.js 20 LTS, Express.js 4.x, TypeScript                                       |
| Database    | PostgreSQL 17 (hosted on Neon) with JSONB, GIN indexes, ENUM types               |
| Data Access | Node-postgres (pg) with raw SQL                                                  |
| Queue       | BullMQ backed by managed Redis (remote service — no local Redis)                 |
| AI          | OpenAI API (gpt-4o-mini for parsing & scoring, gpt-4o for summaries)             |
| Validation  | Zod schemas                                                                      |
| Testing     | Jest + Supertest, Locust for load testing                                        |
| Deployment  | Local development (no Docker, no CI/CD) — native Node.js, Neon DB, managed Redis |
| Real-time   | Server-Sent Events (SSE)                                                         |

## Prompt Engineering Principles

1. Explicit JSON output format (`response_format: { type: 'json_object' }`)
2. Role assignment (expert technical recruiter)
3. Few-shot examples in parsing prompt
4. Explicit null/empty handling for missing data
5. Structured scoring rubric with calibration anchors
6. Versioned prompts (`prompt_version` column for A/B tracking)

## Functional Requirements (from thesis)

| #     | Module              | Requirement                                          |
| ----- | ------------------- | ---------------------------------------------------- |
| FR-01 | Job Management      | CRUD for authenticated recruiters                    |
| FR-02 | Job Management      | Structured skill requirements storage                |
| FR-03 | Application Intake  | PDF/DOCX upload with 5 MB limit                      |
| FR-04 | Resume Parsing      | AI-driven structured extraction via OpenAI           |
| FR-05 | Candidate Matching  | Semantic compatibility score (0–100)                 |
| FR-06 | Screening Summary   | NL summary with strengths, gaps, interview topics    |
| FR-07 | Pipeline Management | Advance/defer/reject with rationale audit            |
| FR-08 | Audit Trail         | Timestamped AI scores, decisions, transitions        |
| FR-09 | Metrics Dashboard   | Real-time KPIs, conversion rates, score distribution |
| FR-10 | Authentication      | JWT auth with RBAC (recruiter, hiring_manager)       |
| FR-11 | Search & Filter     | Skill, score, seniority, status filters              |
| FR-12 | Notifications       | SSE-based processing-complete notifications          |

## Future Enhancements (per thesis)

- WebRTC + Deepgram AI voice screening agent
- Multi-model evaluation (Anthropic Claude for provider redundancy)
- Longitudinal quality-of-hire tracking via HRIS API
- Multilingual resume support
- Structured interview coordination module
- Recruiter feedback loop for prompt quality

## Project Constraints (MUST FOLLOW)

- **NO Docker:** The project must NOT use Docker or Docker Compose. No Dockerfiles, no docker-compose.yml. All services run without containers.
- **NO CI/CD Pipeline:** The project must NOT include CI/CD configuration (no GitHub Actions, no `.github/workflows/`, no pipeline YAML files, no CI scripts). Build, test, and deploy are manual/local operations.
- **Neon DB for PostgreSQL:** PostgreSQL 17 is hosted on Neon (serverless cloud). No local PostgreSQL installation — use the Neon connection string.
- **Managed Redis:** Redis is a remote managed service (not local). No local Redis installation — connect via remote URL.
- These constraints apply to all code, configuration, and documentation generated for this project. Do not create Docker-related or CI-related files unless explicitly requested by the user.

## Key Design Decisions

- Monorepo structure for coordinated frontend+backend changes
- AI service layer isolated from Express routes (no direct API calls from route handlers)
- BullMQ worker concurrency of 3 with rate limiter (10 jobs/60s) to respect OpenAI limits
- gpt-4o-mini for stages 1-2 (cost-effective), gpt-4o for stage 3 (quality)
- Screening results separated from applications table for independent versioning
- Short JWT TTL (15 min) for performance; optional `is_active` check in route handlers
- LATERAL subqueries for N+1 avoidance in candidate queries
- Window function pagination to eliminate separate COUNT query
