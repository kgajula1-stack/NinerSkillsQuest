import type { PrismaClient } from "@prisma/client";
import { DEMO_STUDENT_ID } from "./database";

export class InvalidCoursesError extends Error {}

export async function readCourses(db: PrismaClient): Promise<string[]> {
  const student = await db.student.findUnique({ where: { id: DEMO_STUDENT_ID } });
  if (!student) {
    throw new Error("Sample student not found. Run npm run db:seed.");
  }
  const records = await db.studentCourse.findMany({
    where: { studentId: DEMO_STUDENT_ID, status: "COMPLETED", source: "MANUAL" },
    select: { courseId: true },
    orderBy: { courseId: "asc" },
  });
  return records.map((record) => record.courseId);
}

export async function saveCourses(db: PrismaClient, courseIds: string[]): Promise<void> {
  await db.$transaction(async (tx) => {
    const student = await tx.student.findUnique({ where: { id: DEMO_STUDENT_ID } });
    if (!student) {
      throw new Error("Sample student not found. Run npm run db:seed.");
    }
    const available = await tx.course.findMany({
      where: { id: { in: courseIds }, isActive: true },
      select: { id: true },
    });
    if (available.length !== courseIds.length) {
      throw new InvalidCoursesError("One or more courses are not available.");
    }
    const conflicting = await tx.studentCourse.findFirst({
      where: {
        studentId: DEMO_STUDENT_ID,
        courseId: { in: courseIds },
        OR: [{ status: { not: "COMPLETED" } }, { source: { not: "MANUAL" } }],
      },
    });
    if (conflicting) {
      throw new InvalidCoursesError("A selected course belongs to another course workflow.");
    }
    await tx.studentCourse.deleteMany({
      where: {
        studentId: DEMO_STUDENT_ID,
        status: "COMPLETED",
        source: "MANUAL",
        courseId: { notIn: courseIds },
      },
    });
    for (const courseId of courseIds) {
      await tx.studentCourse.upsert({
        where: { studentId_courseId: { studentId: DEMO_STUDENT_ID, courseId } },
        create: { studentId: DEMO_STUDENT_ID, courseId, status: "COMPLETED" },
        update: {},
      });
    }
  });
}
