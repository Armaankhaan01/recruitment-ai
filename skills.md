# Skills & Recruitment Core System

This document outlines the core application architecture, folder structure, and the handling of skills across the recruitment lifecycle in the Recruitment AI platform.

## 1. Development Environment Setup & Folder Structure

A reproducible, environment-agnostic setup ensures consistency across development, testing, and production. 

### Folder Structure
The project uses a monorepo structure:
```text
recruitment-ai/
├── apps/
│   ├── web/                    # Next.js frontend (App Router)
│   └── api/                    # Node.js / Express.js backend
├── packages/
│   └── types/                  # Shared TypeScript interfaces
# Updated Development Setup (No Docker)

- The project uses a monorepo structure with shared TypeScript types.
- Database migrations are managed via `node-pg-migrate` and raw SQL scripts located in `scripts/sql/`.
- Deployment: Frontend deployed on Vercel; backend runs directly with Node.js using environment variables for Neon PostgreSQL and managed Redis.
- No Docker containers are used; all services run locally or via managed cloud services.
```

### Infrastructure
- **Docker Containerisation:** `docker-compose.yml` orchestrates PostgreSQL, Redis, and the backend API.
- **Database Migrations:** Managed through `node-pg-migrate` (or Prisma), executing pending schema changes automatically on API startup.
- **Deployment:** The Next.js frontend is deployed on Vercel, while the backend API runs as a Docker container on a virtual machine behind a Caddy reverse proxy.

## 2. User Authentication
Authentication uses stateless JSON Web Tokens (JWT) to allow horizontal scaling without shared session state. 
- A short-lived access token is kept in memory.
- A long-lived refresh token is stored in a Secure, `HttpOnly` cookie.
- Passwords are hashed using bcrypt (cost factor 12).
- Express middleware verifies the JWT, and a secondary middleware enforces Role-Based Access Control (RBAC) via the decoded claims (e.g., `req.user.role`).

## 3. Job Management & Skill Requirements
The job management module handles the lifecycle of job requisitions (Draft -> Open -> On Hold -> Closed -> Archived).

### Skill Requirements
Skill requirements are treated as structured data rather than raw text. 
In the UI, recruiters define a dynamic array of skills, each containing:
- Skill name
- Minimum years of experience required
- Required / Preferred toggle

This array maps to a `JSONB` column (`skill_requirements`) in PostgreSQL. By passing structured skills into the AI prompt alongside the job description, the model can explicitly assess whether a candidate meets the minimum experience thresholds.

## 4. Candidate Application Intake
- **Public Portal:** Candidates apply via a Next.js Server Component page that lists open jobs.
- **File Upload:** Resumes (PDF or DOCX) are uploaded via Multer. They undergo MIME type validation and deep "magic byte" signature verification using the `file-type` library.
- **Text Extraction:** Uses `pdf-parse` or `mammoth` to extract raw text asynchronously.
- **BullMQ Integration:** Processing is handed off to a Redis-backed queue, allowing the HTTP request to complete instantly while AI analysis runs in the background.

## 5. Skill Filtering & Database Queries
To efficiently retrieve candidates matching specific skill criteria, the system relies on a heavily optimised PostgreSQL query.

### JSONB Containment Filter
The API filters candidates by skills using the PostgreSQL JSONB containment operator (`@>`). The query leverages a GIN index on the `extracted_skills` array:
```sql
c.extracted_skills @> $2::jsonb
-- With parameter $2 containing '[{"skill":"Node.js"}]'
```
This partial object containment matches the required skill string while correctly ignoring other properties (like `years_experience`) inside the JSON objects.

### Pagination and Joins
The query also uses:
- A `LATERAL` subquery to fetch the single active screening summary per candidate without an N+1 problem.
- A `COUNT(*) OVER()` window function to obtain the total pagination count in a single pass.

## 6. Native PostgreSQL Data Model Reference (Core Entities)

- **User**: Stores authentication details and roles.
- **Job**: Stores `skillRequirements` (JSON), seniority level, salary bounds, and status.
- **Candidate**: Stores `extractedSkills` (JSON), inferred seniority, education, and employment history derived from the parsed resume.
- **Application**: Junction between Candidate and Job, storing the AI compatibility score, status, and AI screening results.
- **AIScreeningResult**: Stores strengths, gaps, and interview focus areas as JSON.
- **RecruiterDecision**: Records decision type and rationale.
- **EventLog**: Append‑only audit trail for all actions.
