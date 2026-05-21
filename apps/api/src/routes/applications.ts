import { Router } from "express";
import { z } from "zod";
import fs from "fs";
const fileType: any = require("file-type");
import prisma from "../db/prisma";
import { logEvent } from "../services/eventLog";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";
import { upload } from "../middleware/upload";
import { enqueueAiProcessing } from "../services/queue/aiQueue";
import { uploadToCloudinary } from "../services/cloudinary";

const router: Router = Router();

const applicationIdSchema = z.object({ id: z.string().uuid() });

const decisionSchema = z.object({
  decisionType: z.enum(["ADVANCE", "REJECT", "DEFER", "SHORTLIST", "WITHDRAW"]),
  rationale: z.string().min(10),
});

// GET /applications (authenticated — list all applications under recruiter's team)
router.get("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view applications." } });
    }

    const [data, total] = await prisma.$transaction([
      prisma.application.findMany({
        where: { job: { teamId: user.teamId } },
        skip,
        take: limit,
        orderBy: { appliedAt: "desc" },
        include: {
          candidate: true,
          job: { select: { title: true } },
        },
      }),
      prisma.application.count({ where: { job: { teamId: user.teamId } } }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// POST /applications (public — candidate portal application submission)
router.post("/", upload.single("resume"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: "MISSING_FILE", message: "Resume file is required" } });
    }

    const fullName = (req.body.fullName as string)?.trim();
    const email = (req.body.email as string)?.trim();
    const jobId = req.body.jobId as string;
    const phone = (req.body.phone as string) || null;

    if (!fullName || !email || !jobId) {
      return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "fullName, email, and jobId are required" } });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const typeResult = await fileType.fromBuffer(fileBuffer);
    if (!typeResult || (!typeResult.mime.includes("pdf") && !typeResult.mime.includes("openxml"))) {
      return res.status(422).json({ error: { code: "INVALID_FILE_TYPE", message: "Only PDF and DOCX are allowed" } });
    }

    // Upload local file to Cloudinary with safe local fallback
    let cloudinaryUrl = req.file.path;
    try {
      cloudinaryUrl = await uploadToCloudinary(req.file.path, "resumes");
      // Clean up the local file after uploading to Cloudinary
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn("Could not delete local upload file:", err);
      }
    } catch (uploadErr) {
      console.warn("Cloudinary upload failed, falling back to local file storage path:", uploadErr);
    }

    try {
      const { candidate, application } = await prisma.$transaction(async (tx: any) => {
        let candidate = await tx.candidate.findFirst({
          where: { email },
        });

        if (candidate) {
          // Check if candidate has already applied to this specific job
          const existingApp = await tx.application.findUnique({
            where: {
              candidateId_jobId: {
                candidateId: candidate.id,
                jobId,
              },
            },
          });

          if (existingApp) {
            throw new Error("ALREADY_APPLIED");
          }

          candidate = await tx.candidate.update({
            where: { id: candidate.id },
            data: {
              fullName,
              phone,
              resumeFilePath: cloudinaryUrl,
              resumeFileType: typeResult.ext,
            },
          });
        } else {
          candidate = await tx.candidate.create({
            data: {
              fullName,
              email,
              phone,
              resumeFilePath: cloudinaryUrl,
              resumeFileType: typeResult.ext,
            },
          });
        }

        const application = await tx.application.create({
          data: {
            candidateId: candidate.id,
            jobId,
            sourceChannel: (req.body.sourceChannel as string) || "direct_portal",
          },
        });

        return { candidate, application };
      });

      await enqueueAiProcessing({
        application_id: application.id,
        candidate_id: candidate.id,
        job_id: jobId,
        resume_file_path: cloudinaryUrl, // Pass Cloudinary secure URL (or local path fallback)
        resume_file_type: typeResult.ext,
      });

      await logEvent("APPLICATION_SUBMITTED", "APPLICATION", application.id, null, {
        jobId,
        candidateName: fullName,
        email,
      });

      res.status(201).json({ applicationId: application.id, status: application.status });
    } catch (err: any) {
      if (err.message === "ALREADY_APPLIED") {
        return res.status(422).json({
          error: {
            code: "ALREADY_APPLIED",
            message: "You have already applied to this job requisition.",
          },
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// GET /applications/public/status/:id (public — candidate tracking status)
router.get("/public/status/:id", async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
      },
    });
    if (!application) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found" } });
    }
    res.json({ status: application.status });
  } catch (err) {
    next(err);
  }
});

// GET /applications/:id (authenticated — team-scoped)
router.get("/:id", authenticate, validate(applicationIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view application details." } });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        candidate: true,
        job: true,
        screeningResult: { where: { isSuperseded: false } },
      },
    });

    if (!application) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found" } });
    }

    if (application.job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This application belongs to a job outside your team." } });
    }

    res.json({
      application,
      candidate: application.candidate,
      screeningResult: application.screeningResult,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /applications/:id/decision (authenticated — team-scoped + audited recruiter decisions)
router.patch("/:id/decision", authenticate, requireRole("RECRUITER"), validate(applicationIdSchema, "params"), validate(decisionSchema), async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const { decisionType, rationale } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to log decisions." } });
    }

    const application = await prisma.application.findUniqueOrThrow({ 
      where: { id },
      include: { job: true }
    });

    if (application.job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This application belongs to a job outside your team." } });
    }

    const statusMap: Record<string, any> = {
      ADVANCE: "SHORTLISTED",
      SHORTLIST: "SHORTLISTED",
      REJECT: "REJECTED",
      DEFER: "REVIEWED",
      WITHDRAW: "WITHDRAWN",
    };

    const newStatus = statusMap[decisionType] || application.status;

    const decision = await prisma.recruiterDecision.create({
      data: {
        applicationId: id,
        decidedById: req.user!.sub,
        decisionType,
        rationale,
        previousStatus: application.status,
        newStatus,
      },
    });

    const updated = await prisma.application.update({
      where: { id },
      data: { status: newStatus },
    });

    await logEvent("RECRUITER_DECISION", "APPLICATION", id, req.user!.sub, {
      decisionType,
      previousStatus: application.status,
      newStatus,
      rationale,
    });

    res.json({ application: updated, decision });
  } catch (err) {
    next(err);
  }
});

// POST /applications/:id/reprocess (authenticated — team-scoped + audited)
router.post("/:id/reprocess", authenticate, requireRole("RECRUITER"), validate(applicationIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to reprocess applications." } });
    }

    const application = await prisma.application.findUniqueOrThrow({
      where: { id: req.params.id as string },
      include: { candidate: true, job: true },
    });

    if (application.job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This application belongs to a job outside your team." } });
    }

    await prisma.application.update({
      where: { id: req.params.id as string },
      data: { retryCount: application.retryCount + 1, processingError: null },
    });

    await enqueueAiProcessing({
      application_id: application.id,
      candidate_id: application.candidate.id,
      job_id: application.jobId,
      resume_file_path: application.candidate.resumeFilePath,
      resume_file_type: application.candidate.resumeFileType,
    });

    await logEvent("APPLICATION_REPROCESSED", "APPLICATION", application.id, req.user!.sub);

    res.json({ queued: true });
  } catch (err) {
    next(err);
  }
});

// GET /applications/:id/decisions (authenticated — team-scoped)
router.get("/:id/decisions", authenticate, validate(applicationIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view decisions." } });
    }

    const application = await prisma.application.findUniqueOrThrow({
      where: { id },
      include: { job: true },
    });

    if (application.job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This application belongs to a job outside your team." } });
    }

    const decisions = await prisma.recruiterDecision.findMany({
      where: { applicationId: id },
      orderBy: { decidedAt: "desc" },
      include: { decidedBy: { select: { id: true, fullName: true, email: true } } },
    });
    res.json({ decisions });
  } catch (err) {
    next(err);
  }
});

export default router;
