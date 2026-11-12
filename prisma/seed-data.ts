import type { PrismaClient } from "@prisma/client";
import { courses, skills } from "../src/data/catalog";
import { careerRoadmaps, employerProfiles } from "../src/data/careerGoals";
import { recommendationCatalog } from "../src/data/recommendations";
import { DEMO_STUDENT_ID } from "../server/database";

export async function seedDatabase(db: PrismaClient): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.student.upsert({
      where: { id: DEMO_STUDENT_ID },
      create: { id: DEMO_STUDENT_ID, email: "sample-student@example.invalid", displayName: "Sample Student" },
      update: {},
    });

    for (const skill of skills) {
      await tx.skill.upsert({
        where: { id: skill.id },
        create: skill,
        update: { name: skill.name },
      });
    }

    for (const course of courses) {
      await tx.course.upsert({
        where: { id: course.id },
        create: { id: course.id, code: course.code, title: course.title },
        update: { code: course.code, title: course.title, isActive: true },
      });
      for (const skillId of course.skillIds) {
        await tx.courseSkill.upsert({
          where: { courseId_skillId: { courseId: course.id, skillId } },
          create: { courseId: course.id, skillId },
          update: {},
        });
      }
    }

    for (const roadmap of careerRoadmaps) {
      const data = { name: roadmap.name, description: roadmap.description };
      await tx.careerRoadmap.upsert({
        where: { id: roadmap.id },
        create: { id: roadmap.id, ...data },
        update: data,
      });
      for (const skillId of roadmap.skillIds) {
        await tx.roadmapSkill.upsert({
          where: { roadmapId_skillId: { roadmapId: roadmap.id, skillId } },
          create: { roadmapId: roadmap.id, skillId },
          update: {},
        });
      }
    }

    for (const employer of employerProfiles) {
      await tx.employer.upsert({
        where: { id: employer.id },
        create: employer,
        update: { name: employer.name, location: employer.location, industry: employer.industry },
      });
    }

    for (const recommendation of recommendationCatalog) {
      for (const elective of recommendation.electives) {
        const id = `elective:${recommendation.skillId}:${elective.code}`;
        const data = { skillId: recommendation.skillId, type: "elective", title: `${elective.code}: ${elective.title}`, url: elective.url };
        await tx.recommendation.upsert({ where: { id }, create: { id, ...data }, update: data });
      }
      for (const resource of recommendation.resources) {
        const id = `resource:${recommendation.skillId}:${resource.title}`;
        const data = { skillId: recommendation.skillId, type: "practice-resource", title: resource.title, url: resource.url };
        await tx.recommendation.upsert({ where: { id }, create: { id, ...data }, update: data });
      }
    }
  }, { timeout: 30000 });
}
