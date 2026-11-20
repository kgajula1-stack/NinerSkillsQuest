import { PrismaClient } from "@prisma/client";
import { courses, skills } from "../src/data/catalog";
import { careerRoadmaps, employerProfiles } from "../src/data/careerGoals";
import { itineraryRecommendations } from "../src/data/itineraryRecommendations";

const prisma = new PrismaClient();
const DEMO_STUDENT_ID = "00000000-0000-0000-0000-000000000001";

async function main(): Promise<void> {
  await prisma.student.upsert({
    where: { id: DEMO_STUDENT_ID },
    update: { email: "demo@niner-skills-quest.local", displayName: "Demo Student" },
    create: {
      id: DEMO_STUDENT_ID,
      email: "demo@niner-skills-quest.local",
      displayName: "Demo Student",
    },
  });

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      update: { name: skill.name },
      create: { id: skill.id, name: skill.name },
    });
  }

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: { code: course.code, title: course.title },
      create: { id: course.id, code: course.code, title: course.title },
    });

    await prisma.courseSkill.deleteMany({ where: { courseId: course.id } });
    await prisma.courseSkill.createMany({
      data: course.skillIds.map((skillId) => ({
        courseId: course.id,
        skillId,
      })),
      skipDuplicates: true,
    });
  }

  for (const roadmap of careerRoadmaps) {
    await prisma.careerRoadmap.upsert({
      where: { id: roadmap.id },
      update: { name: roadmap.name, description: roadmap.description },
      create: {
        id: roadmap.id,
        name: roadmap.name,
        description: roadmap.description,
      },
    });

    await prisma.roadmapSkill.deleteMany({ where: { roadmapId: roadmap.id } });
    await prisma.roadmapSkill.createMany({
      data: roadmap.skillIds.map((skillId) => ({
        roadmapId: roadmap.id,
        skillId,
      })),
      skipDuplicates: true,
    });
  }

  for (const employer of employerProfiles) {
    await prisma.employer.upsert({
      where: { id: employer.id },
      update: {
        name: employer.name,
        location: employer.location,
        industry: employer.industry,
      },
      create: employer,
    });
  }

  for (const recommendation of itineraryRecommendations) {
    await prisma.recommendation.upsert({
      where: { id: recommendation.id },
      update: recommendation,
      create: recommendation,
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
