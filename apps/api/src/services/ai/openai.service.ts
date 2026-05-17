import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Zod Schemas ──

const ParseResumeSchema = z.object({
  fullName: z.string().default("Unknown"),
  email: z.string().email().or(z.string().default("unknown@example.com")),
  phone: z.string().nullish(),
  location: z.string().nullish(),
  extractedSkills: z.array(z.object({ name: z.string(), years: z.number().default(0) })).default([]),
  totalExperienceYears: z.number().nullish(),
  education: z.array(z.object({
    institution: z.string().default("Unknown"),
    degree: z.string().nullish(),
    field: z.string().nullish(),
    year: z.number().nullish(),
  })).default([]),
  employmentHistory: z.array(z.object({
    company: z.string().default("Unknown"),
    role: z.string().default("Employee"),
    startDate: z.string().nullish(),
    endDate: z.string().nullish(),
    description: z.union([z.string(), z.array(z.string())]).transform((val) => Array.isArray(val) ? val.join("\n") : val).default(""),
  })).default([]),
  seniorityInferred: z.enum(["JUNIOR", "MID", "SENIOR", "LEAD", "PRINCIPAL"]).nullish(),
});

const ScoreCandidateSchema = z.object({
  score: z.union([z.number(), z.string()]).transform((val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }).default(0),
  rationale: z.string().optional(),
  explanation: z.string().optional(),
  reason: z.string().optional(),
}).transform((data) => ({
  score: data.score,
  rationale: data.rationale || data.explanation || data.reason || "No explanation provided.",
}));

const ScreeningSummarySchema = z.object({
  summary_text: z.string().optional(),
  summaryText: z.string().optional(),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  interview_focus_areas: z.array(z.string()).default([]),
  interviewFocusAreas: z.array(z.string()).default([]),
}).transform((data) => ({
  summary_text: data.summary_text || data.summaryText || "No summary provided.",
  strengths: data.strengths,
  gaps: data.gaps,
  interview_focus_areas: data.interview_focus_areas.length ? data.interview_focus_areas : data.interviewFocusAreas,
}));

// ── Pipeline Functions ──

export async function parseResume(
  resumeText: string,
  _candidateId: string,
  attempt: number = 1,
  prevError?: string
) {
  const systemPrompt = `
You are an expert technical recruiter and resume parser.
Your task is to extract a highly structured profile from the provided resume text.

${prevError ? `CRITICAL: Your previous attempt failed with the following validation issues. Correct them: ${prevError}` : ""}

Attempt ${attempt} of 3.

Analyze the resume text and respond ONLY with a valid JSON object matching the following JSON Schema:
{
  "fullName": "First Last",
  "email": "candidate@email.com",
  "phone": "phone number string or null",
  "location": "City, Country or null",
  "extractedSkills": [
    { "name": "Skill Name", "years": number }
  ],
  "totalExperienceYears": number (integer or float, or null),
  "education": [
    {
      "institution": "University/School Name",
      "degree": "Degree (e.g. Bachelor of Science) or null",
      "field": "Field of study or null",
      "year": number (graduation year, e.g. 2024, or null)
    }
  ],
  "employmentHistory": [
    {
      "company": "Company/Organization Name",
      "role": "Job Title/Role",
      "startDate": "YYYY-MM or string or null",
      "endDate": "YYYY-MM or string or null",
      "description": "Job responsibilities and accomplishments (as a single flat string)"
    }
  ],
  "seniorityInferred": "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "PRINCIPAL"
}

Extraction Rules:
1. fullName: Extract the candidate's first and last name.
2. email: Extract a valid email address.
3. extractedSkills: List technical skills and estimate the years of experience based on the resume timeline.
4. totalExperienceYears: Calculate total professional experience years based on employment dates.
5. employmentHistory: Extract all past roles. Ensure "description" is a single flat string, not a JSON array.
6. seniorityInferred: Infer based on overall experience:
   - JUNIOR: < 2 years
   - MID: 2-5 years
   - SENIOR: 5-8 years
   - LEAD: 8-12 years
   - PRINCIPAL: > 12 years

Respond ONLY with valid JSON. Do not include any markdown block ticks (\`\`\`) or extra words.
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: resumeText },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = ParseResumeSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    if (attempt < 3) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return parseResume(resumeText, _candidateId, attempt + 1, issues);
    }
    throw new Error(`Resume parse failed after 3 attempts: ${parsed.error.message}`);
  }

  return { ...parsed.data, inputTokens: completion.usage?.prompt_tokens, outputTokens: completion.usage?.completion_tokens };
}

export async function scoreCandidate(
  profile: { fullName: string; extractedSkills: { name: string; years: number }[]; totalExperienceYears: number | null; employmentHistory: { company: string; role: string; startDate: string; endDate: string | null; description: string }[] },
  job: { title: string; description: string; skillRequirements: { name: string; minYears: number; required: boolean }[]; minExperienceYears: number },
  _applicationId: string
) {
  const systemPrompt = `
You evaluate how well a candidate fits a job posting. Score 0-100 and explain why.
Scoring rubric:
  85-100: Strong fit — exceeds most requirements
  70-84: Good fit — meets core requirements
  50-69: Partial fit — meets some requirements, gaps in others
  0-49: Poor fit — missing critical skills

Your JSON response must match this schema exactly:
{
  "score": number (0-100),
  "rationale": string (explanation of the score)
}
Respond ONLY with valid JSON.
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({ candidate: profile, job }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = ScoreCandidateSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(`Score validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function generateScreeningSummary(
  profile: { fullName: string; extractedSkills: { name: string; years: number }[]; totalExperienceYears: number | null },
  job: { title: string; description: string; skillRequirements: { name: string; minYears: number; required: boolean }[] },
  score: number,
  rationale: string,
  _applicationId: string
) {
  const systemPrompt = `
Generate a concise screening summary. Include strengths, gaps, and interview focus areas based on the candidate profile and job requirements.

Your JSON response must match this schema exactly:
{
  "summary_text": string,
  "strengths": string[],
  "gaps": string[],
  "interview_focus_areas": string[]
}
Respond ONLY with valid JSON.
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({ profile, job, score, rationale }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = ScreeningSummarySchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(`Screening summary validation failed: ${parsed.error.message}`);
  }

  return { ...parsed.data, inputTokens: completion.usage?.prompt_tokens, outputTokens: completion.usage?.completion_tokens };
}
