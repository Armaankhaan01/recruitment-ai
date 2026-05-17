import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../db/prisma";
import { logEvent } from "../services/eventLog";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/auth/jwt.service";

const router: Router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(["RECRUITER", "HIRING_MANAGER"]).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
});

const joinTeamSchema = z.object({
  inviteCode: z.string().min(4),
});

// POST /auth/register
router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, fullName, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: { code: "EMAIL_ALREADY_EXISTS", message: "A user with this email address already exists." } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: role || "RECRUITER",
      },
      include: { team: true }
    });

    const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken(user.id);

    res.status(201).json({
      token,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, teamId: user.teamId, team: user.team },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { team: true }
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken(user.id);

    res.json({
      token,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, teamId: user.teamId, team: user.team },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid refresh token" } });
    }
    const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    res.json({ token });
  } catch {
    res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid refresh token" } });
  }
});

// POST /auth/logout
router.post("/logout", authenticate, async (req: AuthRequest, res, next) => {
  try {
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get("/me", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, fullName: true, role: true, teamId: true, team: true },
    });
    if (!user) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// POST /auth/team/create
router.post("/team/create", authenticate, validate(createTeamSchema), async (req: AuthRequest, res, next) => {
  try {
    const { name } = req.body;
    
    // Generate a unique alphanumeric invitation code
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inviteCode = `${name.replace(/\s+/g, "").substring(0, 4).toUpperCase()}-${randomSuffix}`;

    const team = await prisma.team.create({
      data: {
        name,
        inviteCode,
      },
    });

    // Automatically backfill any existing team-less jobs created by this user to their new team
    await prisma.job.updateMany({
      where: { createdById: req.user!.sub, teamId: null },
      data: { teamId: team.id },
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.sub },
      data: { teamId: team.id },
      select: { id: true, email: true, fullName: true, role: true, teamId: true, team: true },
    });

    await logEvent("TEAM_CREATED", "TEAM", team.id, req.user!.sub, { teamName: name, inviteCode });

    res.status(201).json({ user: updatedUser, team });
  } catch (err) {
    next(err);
  }
});

// POST /auth/team/join
router.post("/team/join", authenticate, validate(joinTeamSchema), async (req: AuthRequest, res, next) => {
  try {
    const { inviteCode } = req.body;

    const team = await prisma.team.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
    });

    if (!team) {
      return res.status(404).json({ error: { code: "TEAM_NOT_FOUND", message: "Invalid team invitation code. Please check and try again." } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.sub },
      data: { teamId: team.id },
      select: { id: true, email: true, fullName: true, role: true, teamId: true, team: true },
    });

    // Automatically backfill any existing team-less jobs created by this user to their new team
    await prisma.job.updateMany({
      where: { createdById: req.user!.sub, teamId: null },
      data: { teamId: team.id },
    });

    await logEvent("TEAM_JOINED", "TEAM", team.id, req.user!.sub, { inviteCode });

    res.json({ user: updatedUser, team });
  } catch (err) {
    next(err);
  }
});

export default router;
// Trigger recompile after database was successfully synced with the direct regional host!
