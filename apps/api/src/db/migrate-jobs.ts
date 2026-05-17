import prisma from "./prisma";

async function main() {
  console.log("Starting automatic backfill for stale development jobs...");

  // Find the first team in the database
  const team = await prisma.team.findFirst();
  if (!team) {
    console.log("No teams found in the database. Please create a team first from the recruiter dashboard onboarding portal!");
    return;
  }

  // Update all jobs where teamId is null
  const result = await prisma.job.updateMany({
    where: {
      teamId: null,
    },
    data: {
      teamId: team.id,
    },
  });

  console.log(`Success! Migrated ${result.count} stale development jobs to belong to team "${team.name}" (ID: ${team.id})!`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
