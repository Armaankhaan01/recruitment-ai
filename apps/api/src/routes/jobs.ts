import { Router } from "express";
import { z } from "zod";
import prisma from "../db/prisma";
import { logEvent } from "../services/eventLog";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";

const router: Router = Router();

const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(100),
  skillRequirements: z.array(z.object({
    name: z.string(),
    minYears: z.number().min(0),
    required: z.boolean(),
  })),
  minExperienceYears: z.number().min(0).optional(),
  seniorityLevel: z.enum(["JUNIOR", "MID", "SENIOR", "LEAD", "PRINCIPAL"]).optional(),
  salaryRangeMin: z.number().optional().nullable(),
  salaryRangeMax: z.number().optional().nullable(),
});

const jobIdSchema = z.object({ id: z.string().uuid() });

const JOB_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["OPEN"],
  OPEN: ["ON_HOLD", "CLOSED", "ARCHIVED"],
  ON_HOLD: ["OPEN", "ARCHIVED"],
  CLOSED: ["ARCHIVED"],
};

// GET /jobs/public (public — lists open jobs for candidate portal)
router.get("/public", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.job.findMany({
        where: { status: "OPEN" },
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
      }),
      prisma.job.count({ where: { status: "OPEN" } }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /jobs/public/:id (public — gets a single open job's details for candidate portal)
router.get("/public/:id", validate(jobIdSchema, "params"), async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id as string, status: "OPEN" },
    });
    if (!job) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Job not found" } });
    }
    res.json({ job });
  } catch (err) {
    next(err);
  }
});

// GET /jobs (authenticated — team-scoped)
router.get("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view job requisitions." } });
    }

    const where: Record<string, unknown> = { teamId: user.teamId };
    if (req.query.status) where.status = req.query.status;

    const [data, total] = await prisma.$transaction([
      prisma.job.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.job.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// POST /jobs (authenticated — team-scoped)
router.post("/", authenticate, requireRole("RECRUITER"), validate(createJobSchema), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to create job requisitions." } });
    }

    const job = await prisma.job.create({
      data: {
        ...req.body,
        createdById: req.user!.sub,
        teamId: user.teamId,
        status: "DRAFT",
      },
    });

    await logEvent("JOB_CREATED", "JOB", job.id, req.user!.sub, { title: job.title });

    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
});

// GET /jobs/:id (authenticated — team-scoped)
router.get("/:id", authenticate, validate(jobIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view job details." } });
    }

    const job = await prisma.job.findUniqueOrThrow({ where: { id } });
    if (job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This job requisition does not belong to your team." } });
    }

    const [applicationCount, stageCounts] = await prisma.$transaction([
      prisma.application.count({ where: { jobId: id } }),
      prisma.application.groupBy({
        by: ["status"],
        where: { jobId: id },
        _count: { status: true },
        orderBy: { status: "asc" },
      }),
    ]);

    const stageMap: Record<string, number> = {};
    stageCounts.forEach((s) => { stageMap[s.status] = (s._count as any).status; });

    res.json({ job, applicationCount, stageCounts: stageMap });
  } catch {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Job not found" } });
  }
});

// PATCH /jobs/:id (authenticated — team-scoped + audited)
router.patch("/:id", authenticate, requireRole("RECRUITER"), validate(jobIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to update jobs." } });
    }

    const job = await prisma.job.findUniqueOrThrow({ where: { id } });
    if (job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This job requisition does not belong to your team." } });
    }

    if (req.body.status && req.body.status !== job.status && !JOB_STATUS_TRANSITIONS[job.status]?.includes(req.body.status)) {
      return res.status(422).json({ error: { code: "INVALID_STATUS", message: "Invalid status transition" } });
    }

    const updated = await prisma.job.update({ where: { id }, data: req.body });

    await logEvent("JOB_UPDATED", "JOB", id, req.user!.sub, {
      previousStatus: job.status,
      newStatus: updated.status,
      changes: Object.keys(req.body),
    });

    res.json({ job: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /jobs/:id (authenticated — team-scoped + audited)
router.delete("/:id", authenticate, requireRole("RECRUITER"), validate(jobIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to delete jobs." } });
    }

    const job = await prisma.job.findUniqueOrThrow({ where: { id } });
    if (job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This job requisition does not belong to your team." } });
    }

    await prisma.job.update({ where: { id }, data: { status: "ARCHIVED" } });

    await logEvent("JOB_ARCHIVED", "JOB", id, req.user!.sub);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /jobs/:id/publish (authenticated — team-scoped + audited)
router.patch("/:id/publish", authenticate, requireRole("RECRUITER"), validate(jobIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to publish jobs." } });
    }

    const job = await prisma.job.findUniqueOrThrow({ where: { id } });
    if (job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This job requisition does not belong to your team." } });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: { status: "OPEN", publishedAt: new Date() },
    });

    await logEvent("JOB_PUBLISHED", "JOB", id, req.user!.sub);

    res.json({ job: updatedJob });
  } catch (err) {
    next(err);
  }
});

// PATCH /jobs/:id/close (authenticated — team-scoped + audited)
router.patch("/:id/close", authenticate, requireRole("RECRUITER"), validate(jobIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to close jobs." } });
    }

    const job = await prisma.job.findUniqueOrThrow({ where: { id } });
    if (job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This job requisition does not belong to your team." } });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    await logEvent("JOB_CLOSED", "JOB", id, req.user!.sub);

    res.json({ job: updatedJob });
  } catch (err) {
    next(err);
  }
});

// GET /jobs/:id/candidates (authenticated — team-scoped)
router.get("/:id/candidates", authenticate, validate(jobIdSchema, "params"), async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view candidate applicants." } });
    }

    const job = await prisma.job.findUniqueOrThrow({ where: { id } });
    if (job.teamId !== user.teamId) {
      return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "This job requisition does not belong to your team." } });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { jobId: id };
    if (req.query.status) where.status = req.query.status;

    const applications = await prisma.application.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ aiCompatibilityScore: "desc" }, { appliedAt: "desc" }],
      include: { candidate: true },
    });

    const total = await prisma.application.count({ where });

    res.json({ data: applications, total, page, limit });
  } catch (err) {
    next(err);
  }
});

export default router;
