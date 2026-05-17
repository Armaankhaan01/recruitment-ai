import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing authorization token" } });
  }

  const token = header.split(" ")[1];
  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token!, secret) as unknown as { sub: string; email: string; role: string };
    req.user = payload;
    next();
  } catch (err) {
    const code = err instanceof jwt.TokenExpiredError ? "TOKEN_EXPIRED" : "INVALID_TOKEN";
    return res.status(401).json({ error: { code, message: "Invalid or expired token" } });
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  return secret;
}
