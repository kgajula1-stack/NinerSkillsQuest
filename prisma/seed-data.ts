import type { PrismaClient } from "@prisma/client";
import { courses, skills } from "../src/data/catalog";
import { DEMO_STUDENT_ID } from "../server/database";

export async function seedDatabase(db: PrismaClient): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.student.upsert({
      where: { id: DEMO_STUDENT_ID },
      create: { id: DEMO_STUDENT_ID, displayName: "Sample Student" },
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
  });
}
