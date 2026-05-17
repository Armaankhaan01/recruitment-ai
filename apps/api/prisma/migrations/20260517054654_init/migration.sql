-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('RECRUITER', 'HIRING_MANAGER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SeniorityLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'PROCESSING', 'SCORING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('ADVANCE', 'REJECT', 'DEFER', 'SHORTLIST', 'WITHDRAW');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RECRUITER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "skillRequirements" JSONB NOT NULL DEFAULT '[]',
    "minExperienceYears" INTEGER NOT NULL DEFAULT 0,
    "seniorityLevel" "SeniorityLevel" NOT NULL DEFAULT 'MID',
    "salaryRangeMin" DECIMAL(10,2),
    "salaryRangeMax" DECIMAL(10,2),
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMPTZ(6),
    "closedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "location" VARCHAR(150),
    "extractedSkills" JSONB NOT NULL DEFAULT '[]',
    "totalExperienceYears" DECIMAL(4,1),
    "education" JSONB NOT NULL DEFAULT '[]',
    "employmentHistory" JSONB NOT NULL DEFAULT '[]',
    "seniorityInferred" "SeniorityLevel",
    "rawResumeText" TEXT,
    "resumeFilePath" VARCHAR(500) NOT NULL,
    "resumeFileType" VARCHAR(10) NOT NULL,
    "parseModelVersion" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "appliedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "aiCompatibilityScore" DECIMAL(5,2),
    "aiScoreRationale" TEXT,
    "processingStartedAt" TIMESTAMPTZ(6),
    "processingCompletedAt" TIMESTAMPTZ(6),
    "processingError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "sourceChannel" VARCHAR(100) NOT NULL DEFAULT 'direct_portal',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_screening_results" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "summaryText" TEXT NOT NULL,
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "gaps" JSONB NOT NULL DEFAULT '[]',
    "interviewFocusAreas" JSONB NOT NULL DEFAULT '[]',
    "modelVersion" VARCHAR(50) NOT NULL,
    "promptVersion" VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    "inputTokenCount" INTEGER,
    "outputTokenCount" INTEGER,
    "generatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSuperseded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ai_screening_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_decisions" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "decidedById" UUID NOT NULL,
    "decisionType" "DecisionType" NOT NULL,
    "rationale" TEXT NOT NULL,
    "previousStatus" "ApplicationStatus" NOT NULL,
    "newStatus" "ApplicationStatus" NOT NULL,
    "decidedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_log" (
    "id" UUID NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID NOT NULL,
    "actorId" UUID,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "jobs_status_seniorityLevel_idx" ON "jobs"("status", "seniorityLevel");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "candidates_seniorityInferred_idx" ON "candidates"("seniorityInferred");

-- CreateIndex
CREATE INDEX "applications_jobId_aiCompatibilityScore_idx" ON "applications"("jobId", "aiCompatibilityScore" DESC);

-- CreateIndex
CREATE INDEX "applications_jobId_status_idx" ON "applications"("jobId", "status");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_appliedAt_idx" ON "applications"("appliedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "applications_candidateId_jobId_key" ON "applications"("candidateId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_screening_results_applicationId_key" ON "ai_screening_results"("applicationId");

-- CreateIndex
CREATE INDEX "ai_screening_results_applicationId_generatedAt_idx" ON "ai_screening_results"("applicationId", "generatedAt" DESC);

-- CreateIndex
CREATE INDEX "recruiter_decisions_applicationId_decidedAt_idx" ON "recruiter_decisions"("applicationId", "decidedAt" DESC);

-- CreateIndex
CREATE INDEX "event_log_entityType_entityId_occurredAt_idx" ON "event_log"("entityType", "entityId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "event_log_eventType_occurredAt_idx" ON "event_log"("eventType", "occurredAt" DESC);

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_screening_results" ADD CONSTRAINT "ai_screening_results_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_decisions" ADD CONSTRAINT "recruiter_decisions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_decisions" ADD CONSTRAINT "recruiter_decisions_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
