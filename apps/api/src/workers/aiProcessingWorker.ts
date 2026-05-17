import { Worker, Job, ConnectionOptions } from "bullmq";
import prisma from "../db/prisma";
import sseEmitter from "../sse/sseEmitter";
import { parseResume, scoreCandidate, generateScreeningSummary } from "../services/ai/openai.service";
import { extractText } from "../services/files/extractText";

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
};

export const aiProcessingWorker = new Worker(
  "ai-processing",
  async (job: Job<{ application_id: string; candidate_id: string; job_id: string; resume_file_path: string; resume_file_type: string }>) => {
    const { application_id, candidate_id, job_id, resume_file_path, resume_file_type } = job.data;

    // 1. Mark processing
    await prisma.application.update({
      where: { id: application_id },
      data: { status: "PROCESSING", processingStartedAt: new Date() },
    });

    try {
      // 2. Parse resume
      const resumeText = await extractText(resume_file_path, resume_file_type);
      const { inputTokens, outputTokens, ...candidateData } = await parseResume(resumeText, candidate_id);

      await prisma.candidate.update({
        where: { id: candidate_id },
        data: {
          ...candidateData,
          rawResumeText: resumeText,
          resumeFilePath: resume_file_path,
          resumeFileType: resume_file_type,
          parseModelVersion: "gpt-4o-mini",
        },
      });

      // 3. Scoring
      await prisma.application.update({
        where: { id: application_id },
        data: { status: "SCORING" },
      });

      const job = await prisma.job.findUniqueOrThrow({
        where: { id: job_id },
        select: {
          title: true,
          description: true,
          skillRequirements: true,
          minExperienceYears: true,
        },
      });

      const candidate = await prisma.candidate.findUniqueOrThrow({
        where: { id: candidate_id },
        select: {
          fullName: true,
          extractedSkills: true,
          totalExperienceYears: true,
          employmentHistory: true,
        },
      });

      const { score, rationale } = await scoreCandidate(
        {
          fullName: candidate.fullName,
          extractedSkills: candidate.extractedSkills as any,
          totalExperienceYears: Number(candidate.totalExperienceYears),
          employmentHistory: candidate.employmentHistory as any,
        },
        {
          title: job.title,
          description: job.description,
          skillRequirements: job.skillRequirements as any,
          minExperienceYears: job.minExperienceYears,
        },
        application_id
      );

      await prisma.application.update({
        where: { id: application_id },
        data: {
          aiCompatibilityScore: score,
          aiScoreRationale: rationale,
        },
      });

      // 4. Screening summary
      const summary = await generateScreeningSummary(
        {
          fullName: candidate.fullName,
          extractedSkills: candidate.extractedSkills as any,
          totalExperienceYears: Number(candidate.totalExperienceYears),
        },
        {
          title: job.title,
          description: job.description,
          skillRequirements: job.skillRequirements as any,
        },
        score,
        rationale,
        application_id
      );

      await prisma.aIScreeningResult.create({
        data: {
          applicationId: application_id,
          summaryText: summary.summary_text,
          strengths: summary.strengths as any,
          gaps: summary.gaps as any,
          interviewFocusAreas: summary.interview_focus_areas as any,
          modelVersion: "gpt-4o",
          inputTokenCount: summary.inputTokens,
          outputTokenCount: summary.outputTokens,
        },
      });

      // 5. Mark reviewed
      await prisma.application.update({
        where: { id: application_id },
        data: { status: "REVIEWED", processingCompletedAt: new Date() },
      });

      // 6. SSE notification
      sseEmitter.emit("application:processed", {
        applicationId: application_id,
        jobId: job_id,
        score,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      await prisma.application.update({
        where: { id: application_id },
        data: { processingError: message },
      });

      sseEmitter.emit("application:failed", {
        applicationId: application_id,
        error: message,
      });

      throw err;
    }
  },
  { connection, concurrency: 3, limiter: { max: 10, duration: 60000 } }
);
