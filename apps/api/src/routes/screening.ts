import { Router } from "express";
import { z } from "zod";
import prisma from "../db/prisma";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";

const router: Router = Router();

const applicationIdSchema = z.object({ applicationId: z.string().uuid() });

// GET /screening/:applicationId
router.get("/:applicationId", authenticate, validate(applicationIdSchema, "params"), async (req, res, next) => {
  try {
    const result = await prisma.aIScreeningResult.findFirst({
      where: { applicationId: req.params.applicationId as string, isSuperseded: false },
    });
    if (!result) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Active screening result not found" } });
    }
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// GET /screening/:applicationId/history
router.get("/:applicationId/history", authenticate, validate(applicationIdSchema, "params"), async (req, res, next) => {
  try {
    const results = await prisma.aIScreeningResult.findMany({
      where: { applicationId: req.params.applicationId as string },
      orderBy: { generatedAt: "desc" },
    });
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
