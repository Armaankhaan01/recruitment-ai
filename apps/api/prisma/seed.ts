import bcrypt from "bcryptjs";
import prisma from "../src/db/prisma";

async function main() {
  const password = await bcrypt.hash("recruiter123", 10);

  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@example.com" },
    update: {},
    create: {
      email: "recruiter@example.com",
      fullName: "Demo Recruiter",
      passwordHash: password,
      role: "RECRUITER",
    },
  });

  const jobs = [
    {
      title: "Senior Frontend Engineer",
      description: "We are looking for a Senior Frontend Engineer with deep React and TypeScript experience to lead our web application team.",
      location: "New York, NY (Hybrid)",
      skillRequirements: [
        { name: "React", minYears: 4, required: true },
        { name: "TypeScript", minYears: 3, required: true },
        { name: "Next.js", minYears: 2, required: false },
        { name: "Tailwind CSS", minYears: 1, required: false },
      ],
      minExperienceYears: 5,
      seniorityLevel: "SENIOR" as const,
      salaryRangeMin: 120000,
      salaryRangeMax: 160000,
      status: "OPEN" as const,
      publishedAt: new Date(),
      createdById: recruiter.id,
    },
    {
      title: "Mid-Level Backend Developer",
      description: "Join our backend team to build scalable API services using Node.js, Express, and PostgreSQL.",
      location: "Remote",
      skillRequirements: [
        { name: "Node.js", minYears: 3, required: true },
        { name: "PostgreSQL", minYears: 2, required: true },
        { name: "REST APIs", minYears: 2, required: true },
      ],
      minExperienceYears: 3,
      seniorityLevel: "MID" as const,
      salaryRangeMin: 80000,
      salaryRangeMax: 110000,
      status: "DRAFT" as const,
      createdById: recruiter.id,
    },
    {
      title: "Principal Software Engineer",
      description: "Lead technical direction for our platform team, architecting solutions across microservices and cloud infrastructure.",
      location: "San Francisco, CA",
      skillRequirements: [
        { name: "System Design", minYears: 5, required: true },
        { name: "Cloud (AWS/GCP)", minYears: 4, required: true },
        { name: "Go or Rust", minYears: 3, required: false },
      ],
      minExperienceYears: 8,
      seniorityLevel: "PRINCIPAL" as const,
      salaryRangeMin: 180000,
      salaryRangeMax: 240000,
      status: "OPEN" as const,
      publishedAt: new Date(),
      createdById: recruiter.id,
    },
  ];

  for (const job of jobs) {
    const existing = await prisma.job.findFirst({
      where: { title: job.title },
    });
    if (!existing) {
      await prisma.job.create({
        data: job,
      });
    }
  }

  console.log(`Seeded: 1 user, ${jobs.length} sample jobs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
