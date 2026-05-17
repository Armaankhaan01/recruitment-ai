import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema, target: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[target];
    try {
      schema.parse(data);
      next();
    } catch (err) {
      const issues = (err as ZodError).issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      res.status(422).json({ error: { code: "VALIDATION_ERROR", message: issues } });
    }
  };
}
