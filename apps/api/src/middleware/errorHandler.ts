import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err.message);

  if (res.headersSent) {
    return _next(err);
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}
