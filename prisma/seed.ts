import { PrismaClient } from "@prisma/client";
import { courses, skills } from "../src/data/catalog";
import { careerRoadmaps, employerProfiles } from "../src/data/careerGoals";
import { recommendationCatalog } from "../src/data/recommendations";

const prisma = new PrismaClient();

async function main(): Promise<void> {
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

  for (const recommendation of recommendationCatalog) {
    for (const elective of recommendation.electives) {
      await prisma.recommendation.upsert({
        where: { id: `elective:${recommendation.skillId}:${elective.code}` },
        update: {
          skillId: recommendation.skillId,
          type: "elective",
          title: `${elective.code}: ${elective.title}`,
          url: elective.url,
        },
        create: {
          id: `elective:${recommendation.skillId}:${elective.code}`,
          skillId: recommendation.skillId,
          type: "elective",
          title: `${elective.code}: ${elective.title}`,
          url: elective.url,
        },
      });
    }

    for (const resource of recommendation.resources) {
      await prisma.recommendation.upsert({
        where: { id: `resource:${recommendation.skillId}:${resource.title}` },
        update: {
          skillId: recommendation.skillId,
          type: "practice-resource",
          title: resource.title,
          url: resource.url,
        },
        create: {
          id: `resource:${recommendation.skillId}:${resource.title}`,
          skillId: recommendation.skillId,
          type: "practice-resource",
          title: resource.title,
          url: resource.url,
        },
      });
    }
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
