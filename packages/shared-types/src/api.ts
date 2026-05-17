export type UserRole = "RECRUITER" | "HIRING_MANAGER";
export type JobStatus = "DRAFT" | "OPEN" | "ON_HOLD" | "CLOSED" | "ARCHIVED";
export type SeniorityLevel = "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "PRINCIPAL";

export type ApplicationStatus =
  | "SUBMITTED"
  | "PROCESSING"
  | "SCORING"
  | "REVIEWED"
  | "SHORTLISTED"
  | "REJECTED"
  | "WITHDRAWN";

export type DecisionType = "ADVANCE" | "REJECT" | "DEFER" | "SHORTLIST" | "WITHDRAW";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Job {
  id: string;
  createdById: string;
  title: string;
  description: string;
  skillRequirements: SkillRequirement[];
  minExperienceYears: number;
  seniorityLevel: SeniorityLevel;
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  status: JobStatus;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRequirement {
  name: string;
  minYears: number;
  required: boolean;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  extractedSkills: ExtractedSkill[];
  totalExperienceYears: number | null;
  education: Education[];
  employmentHistory: EmploymentEntry[];
  seniorityInferred: SeniorityLevel | null;
  rawResumeText: string | null;
  resumeFilePath: string;
  resumeFileType: string;
  parseModelVersion: string | null;
  createdAt: string;
}

export interface ExtractedSkill {
  name: string;
  years: number;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: number;
}

export interface EmploymentEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  appliedAt: string;
  status: ApplicationStatus;
  aiCompatibilityScore: number | null;
  aiScoreRationale: string | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  processingError: string | null;
  retryCount: number;
  sourceChannel: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithCandidate extends Application {
  candidate: Candidate;
}

export interface AIScreeningResult {
  id: string;
  applicationId: string;
  summaryText: string;
  strengths: string[];
  gaps: string[];
  interviewFocusAreas: string[];
  modelVersion: string;
  promptVersion: string;
  inputTokenCount: number | null;
  outputTokenCount: number | null;
  generatedAt: string;
  isSuperseded: boolean;
}

export interface RecruiterDecision {
  id: string;
  applicationId: string;
  decidedById: string;
  decisionType: DecisionType;
  rationale: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  decidedAt: string;
}

export interface ApplicationSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  status: ApplicationStatus;
  aiCompatibilityScore: number | null;
  appliedAt: string;
}

export interface EventLog {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
}

// API Response shapes
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface JobWithPipeline extends Job {
  applicationCount: number;
  stageCounts: Record<ApplicationStatus, number>;
}

export interface MetricsOverview {
  totalJobs: number;
  totalApplications: number;
  avgTimeToFillDays: number;
  avgAiScore: number;
  totalShortlisted: number;
}

export interface TimeToFillEntry {
  jobId: string;
  title: string;
  daysOpen: number;
  stageDurations: Record<string, number>;
}

export interface ConversionEntry {
  stage: string;
  count: number;
  conversionRate: number;
}

export interface ScoreBucket {
  range: string;
  count: number;
}

export interface ScoreDistribution {
  buckets: ScoreBucket[];
  mean: number;
  median: number;
}

export interface SourceEffectiveness {
  sourceChannel: string;
  total: number;
  shortlisted: number;
  conversionRate: number;
}

// SSE Event types
export interface SSEProcessedEvent {
  applicationId: string;
  jobId: string;
  score: number;
}

export interface SSEFailedEvent {
  applicationId: string;
  error: string;
}
