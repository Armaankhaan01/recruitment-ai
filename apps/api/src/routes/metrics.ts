import { Router } from "express";
import prisma from "../db/prisma";
import { authenticate, AuthRequest } from "../middleware/authenticate";

const router: Router = Router();

// GET /metrics/overview
router.get("/overview", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view metrics." } });
    }
    const teamId = user.teamId;

    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

    const [totalJobs, totalApplications, avgAiScore, totalShortlisted, closedJobs] = await prisma.$transaction([
      prisma.job.count({ where: { teamId, status: "OPEN" } }),
      prisma.application.count({ where: { job: { teamId }, appliedAt: { gte: from, lte: to } } }),
      prisma.application.aggregate({
        where: { job: { teamId }, status: "REVIEWED", processingCompletedAt: { gte: from, lte: to } },
        _avg: { aiCompatibilityScore: true },
      }),
      prisma.application.count({ where: { job: { teamId }, status: "SHORTLISTED" } }),
      prisma.job.findMany({
        where: { teamId, status: "CLOSED", publishedAt: { not: null }, closedAt: { not: null } },
        select: { publishedAt: true, closedAt: true },
      }),
    ]);

    let avgTimeToFillDays = 0;
    if (closedJobs.length > 0) {
      const totalDays = closedJobs.reduce((sum, job) => {
        const published = job.publishedAt!;
        const closed = job.closedAt!;
        const diffMs = closed.getTime() - published.getTime();
        return sum + (diffMs / (1000 * 60 * 60 * 24));
      }, 0);
      avgTimeToFillDays = Math.round(totalDays / closedJobs.length);
    }

    res.json({
      totalJobs,
      totalApplications,
      avgTimeToFillDays,
      avgAiScore: Number(avgAiScore._avg?.aiCompatibilityScore ?? 0).toFixed(1),
      totalShortlisted,
    });
  } catch (err) {
    next(err);
  }
});

// GET /metrics/time-to-fill
router.get("/time-to-fill", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view metrics." } });
    }
    const teamId = user.teamId;

    const jobs = await prisma.job.findMany({
      where: { teamId, status: "CLOSED" },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        closedAt: true,
      },
    });

    const data = jobs.map((job) => ({
      jobId: job.id,
      title: job.title,
      daysOpen: job.publishedAt && job.closedAt ? Math.round((job.closedAt.getTime() - job.publishedAt.getTime()) / (1000 * 60 * 60 * 24)) : null,
      stageDurations: {},
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /metrics/conversion
router.get("/conversion", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view metrics." } });
    }
    const teamId = user.teamId;

    const groups = await prisma.application.groupBy({
      by: ["status"],
      where: { job: { teamId } },
      _count: { status: true },
    });

    const total = groups.reduce((sum, g) => sum + g._count.status, 0);
    const data = groups.map((g) => ({
      stage: g.status,
      count: g._count.status,
      conversionRate: total > 0 ? g._count.status / total : 0,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /metrics/score-distribution
router.get("/score-distribution", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view metrics." } });
    }
    const teamId = user.teamId;

    const jobId = req.query.jobId as string | undefined;

    if (jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job || job.teamId !== teamId) {
        return res.status(403).json({ error: { code: "ACCESS_DENIED", message: "Job not found or access denied." } });
      }
    }

    const where: any = jobId ? { jobId } : { job: { teamId } };

    const apps = await prisma.application.findMany({
      where: { ...where, aiCompatibilityScore: { not: null } },
      select: { aiCompatibilityScore: true },
    });

    const buckets = [
      { range: "0-10", count: 0 },
      { range: "11-20", count: 0 },
      { range: "21-30", count: 0 },
      { range: "31-40", count: 0 },
      { range: "41-50", count: 0 },
      { range: "51-60", count: 0 },
      { range: "61-70", count: 0 },
      { range: "71-80", count: 0 },
      { range: "81-90", count: 0 },
      { range: "91-100", count: 0 },
    ];

    const scores = apps.map((a) => Number(a.aiCompatibilityScore ?? 0));

    scores.forEach((s) => {
      const idx = Math.min(Math.floor(s / 10), 9);
      const bucket = buckets[idx];
      if (idx >= 0 && bucket) bucket.count++;
    });

    const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const sorted = [...scores].sort((a, b) => a - b);
    let median = 0;
    if (sorted.length > 0) {
      if (sorted.length % 2 === 0) {
        const val1 = sorted[sorted.length / 2 - 1] ?? 0;
        const val2 = sorted[sorted.length / 2] ?? 0;
        median = (val1 + val2) / 2;
      } else {
        median = sorted[Math.floor(sorted.length / 2)] ?? 0;
      }
    }

    res.json({ buckets, mean: mean.toFixed(1), median: median.toFixed(1) });
  } catch (err) {
    next(err);
  }
});

// GET /metrics/source-effectiveness
router.get("/source-effectiveness", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.teamId) {
      return res.status(403).json({ error: { code: "NO_TEAM", message: "You must belong to a team to view metrics." } });
    }
    const teamId = user.teamId;

    const groups = await prisma.application.groupBy({
      by: ["sourceChannel"],
      where: { job: { teamId } },
      _count: { sourceChannel: true },
    });

    const data = await Promise.all(
      groups.map(async (g) => {
        const shortlisted = await prisma.application.count({
          where: { job: { teamId }, sourceChannel: g.sourceChannel, status: "SHORTLISTED" },
        });
        return {
          sourceChannel: g.sourceChannel,
          total: g._count.sourceChannel,
          shortlisted,
          conversionRate: g._count.sourceChannel > 0 ? shortlisted / g._count.sourceChannel : 0,
        };
      })
    );

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
