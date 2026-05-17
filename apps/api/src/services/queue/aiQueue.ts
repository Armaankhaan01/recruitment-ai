import { Queue, ConnectionOptions } from "bullmq";

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
};

export const aiQueue = new Queue("ai-processing", { connection });

export type AIBatchJob = {
  application_id: string;
  candidate_id: string;
  job_id: string;
  resume_file_path: string;
  resume_file_type: string;
};

export const enqueueAiProcessing = (payload: AIBatchJob) =>
  aiQueue.add("process", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
