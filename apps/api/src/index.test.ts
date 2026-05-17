import request from "supertest";
import app from "./index";
import prisma from "./db/prisma";

// Mock the prisma client queryRaw function
jest.mock("./db/prisma", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    job: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}));

describe("Integration Tests - API Server Routes", () => {
  describe("GET /api/v1/health", () => {
    it("should return ok status when database is responsive", async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([1]);

      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "ok",
        timestamp: expect.any(String),
        dbConnected: true,
        redisConnected: true,
      });
    });

    it("should return degraded status when database query fails", async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error("DB Connection Error"));

      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        status: "degraded",
        timestamp: expect.any(String),
        dbConnected: false,
        redisConnected: true,
      });
    });
  });

  describe("GET /api/v1/jobs/public", () => {
    it("should return a list of public open jobs without authentication", async () => {
      const mockJobs = [
        { id: "1", title: "React Developer", status: "OPEN" },
        { id: "2", title: "Node Developer", status: "OPEN" },
      ];
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([mockJobs, 2]);

      const response = await request(app).get("/api/v1/jobs/public");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBe("React Developer");
    });
  });
});
