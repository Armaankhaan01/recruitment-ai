import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import prisma from "./db/prisma";
import { errorHandler } from "./middleware/errorHandler";
import { sseHandler } from "./sse/sseHandler";
import authRouter from "./routes/auth";
import jobsRouter from "./routes/jobs";
import applicationsRouter from "./routes/applications";
import candidatesRouter from "./routes/candidates";
import screeningRouter from "./routes/screening";
import metricsRouter from "./routes/metrics";
import { authenticate } from "./middleware/authenticate";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, health checks, or curl requests)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.some((allowed) => allowed === origin) ||
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app");

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Rejected request from origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Route groups
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", jobsRouter);
app.use("/api/v1/applications", applicationsRouter);
app.use("/api/v1/candidates", candidatesRouter);
app.use("/api/v1/screening", screeningRouter);
app.use("/api/v1/metrics", metricsRouter);

// System routes
app.get("/api/v1/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", timestamp: new Date().toISOString(), dbConnected: true, redisConnected: true });
  } catch {
    res.status(503).json({ status: "degraded", timestamp: new Date().toISOString(), dbConnected: false, redisConnected: true });
  }
});

app.get("/api/v1/events", authenticate, sseHandler);

app.use(errorHandler);

// Instantiate and start the BullMQ AI processing worker
import { aiProcessingWorker } from "./workers/aiProcessingWorker";

aiProcessingWorker.on("ready", () => {
  console.log("BullMQ AI Processing Worker is active and listening for jobs.");
});

aiProcessingWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});

let server: any;

if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
} else {
  server = app;
}

export default server;
