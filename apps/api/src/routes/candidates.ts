import { Router } from "express";
import { z } from "zod";
import prisma from "../db/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";

const router: Router = Router();

const candidateIdSchema = z.object({ id: z.string().uuid() });

// GET /candidates
router.get("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view candidates." } });
    }

    const where: any = {
      applications: {
        some: {
          job: {
            teamId: user.teamId,
          },
        },
      },
    };

    if (req.query.skill) {
      where.extractedSkills = {
        array_contains: [{ name: req.query.skill as string }],
      };
    }

    if (req.query.seniority) {
      where.seniorityInferred = req.query.seniority;
    }

    const [data, total] = await prisma.$transaction([
      prisma.candidate.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.candidate.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /candidates/:id
router.get("/:id", authenticate, validate(candidateIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view candidate details." } });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: req.params.id as string },
      include: {
        applications: {
          where: { job: { teamId: user.teamId } },
          include: { job: { select: { title: true, id: true } } },
          orderBy: { appliedAt: "desc" },
        },
      },
    });

    if (!candidate || candidate.applications.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Candidate not found" } });
    }

    const applications = candidate.applications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job.title,
      status: app.status,
      aiCompatibilityScore: app.aiCompatibilityScore,
      appliedAt: app.appliedAt,
    }));

    res.json({
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        extractedSkills: candidate.extractedSkills,
        totalExperienceYears: candidate.totalExperienceYears,
        education: candidate.education,
        employmentHistory: candidate.employmentHistory,
        seniorityInferred: candidate.seniorityInferred,
      },
      applications,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /candidates/:id
router.delete("/:id", authenticate, requireRole("RECRUITER"), validate(candidateIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to delete candidates." } });
    }

    const candidateAppCount = await prisma.application.count({
      where: {
        candidateId: req.params.id as string,
        job: { teamId: user.teamId },
      },
    });

    if (candidateAppCount === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Candidate not found" } });
    }

    await prisma.candidate.update({
      where: { id: req.params.id as string },
      data: {
        fullName: `DELETED_${req.params.id}`,
        email: `deleted_${req.params.id}@system.local`,
        phone: null,
        location: null,
        extractedSkills: [],
        totalExperienceYears: null,
        education: [],
        employmentHistory: [],
        seniorityInferred: null,
        rawResumeText: null,
        resumeFilePath: "DELETED",
        resumeFileType: "DELETED",
      },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
