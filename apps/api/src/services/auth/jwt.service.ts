import jwt from "jsonwebtoken";

function getSecret(name: string): string {
  const env = name === "refresh" ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
  if (!env) {
    throw new Error(`${name} secret must be set`);
  }
  return env;
}

export function signAccessToken(payload: { sub: string; email: string; role: string }): string {
  const expires = process.env.JWT_EXPIRES_IN || "15m";
  return jwt.sign(payload, getSecret("access"), { expiresIn: expires as any });
}

export function signRefreshToken(userId: string): string {
  const expires = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  return jwt.sign({ sub: userId }, getSecret("refresh"), { expiresIn: expires as any });
}

export function verifyAccessToken(token: string): { sub: string; email: string; role: string } {
  return jwt.verify(token, getSecret("access")) as { sub: string; email: string; role: string };
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, getSecret("refresh")) as { sub: string };
}
