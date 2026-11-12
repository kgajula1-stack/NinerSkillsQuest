import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createDatabase } from "../server/database";

describe("transcript data cleanup migration", () => {
  it("keeps confirmed coursework and removes stored transcript data", async () => {
    const directory = mkdtempSync(join(tmpdir(), "niner-transcript-migration-"));
    const url = `file:${join(directory, "test.db")}`;
    const prismaCli = resolve("node_modules", "prisma", "build", "index.js");
    const env = { ...process.env, DATABASE_URL: url };
    try {
      const db = createDatabase(url);
      try {
        const initialSql = readFileSync(
          resolve("prisma", "migrations", "20261110203529_init", "migration.sql"),
          "utf8",
        );
        for (const statement of initialSql.split(";").map((part) => part.trim()).filter(Boolean)) {
          await db.$executeRawUnsafe(statement);
        }
        await db.$executeRawUnsafe(
          `INSERT INTO students (id, updatedAt) VALUES ('student', CURRENT_TIMESTAMP), ('other', CURRENT_TIMESTAMP)`,
        );
        await db.$executeRawUnsafe(
          `INSERT INTO courses (id, code, title) VALUES
          ('manual', 'MANUAL', 'Manual'), ('accepted', 'ACCEPTED', 'Accepted'),
          ('pending', 'PENDING', 'Pending'), ('mismatch', 'MISMATCH', 'Mismatch')`,
        );
        await db.$executeRawUnsafe(
          `INSERT INTO transcripts (id, studentId, originalFileName, mediaType, sizeBytes, storageKey)
         VALUES ('transcript', 'student', 'private.pdf', 'application/pdf', 123, 'private-key')`,
        );
        await db.$executeRawUnsafe(
          `INSERT INTO transcript_course_candidates
          (id, transcriptId, rawCourseCode, matchedCourseId, reviewStatus, updatedAt)
         VALUES ('accepted', 'transcript', 'RAW-ACCEPTED', 'accepted', 'ACCEPTED', CURRENT_TIMESTAMP),
                ('pending', 'transcript', 'RAW-PENDING', 'pending', 'PENDING', CURRENT_TIMESTAMP),
                ('mismatch', 'transcript', 'RAW-MISMATCH', 'manual', 'ACCEPTED', CURRENT_TIMESTAMP),
                ('wrong-student', 'transcript', 'RAW-OTHER', 'accepted', 'ACCEPTED', CURRENT_TIMESTAMP)`,
        );
        await db.$executeRawUnsafe(
          `INSERT INTO student_courses (id, studentId, courseId, transcriptCandidateId, updatedAt)
         VALUES ('manual', 'student', 'manual', NULL, CURRENT_TIMESTAMP),
                ('accepted', 'student', 'accepted', 'accepted', CURRENT_TIMESTAMP),
                ('pending', 'student', 'pending', 'pending', CURRENT_TIMESTAMP),
                ('mismatch', 'student', 'mismatch', 'mismatch', CURRENT_TIMESTAMP),
                ('wrong-student', 'other', 'accepted', 'wrong-student', CURRENT_TIMESTAMP)`,
        );
      } finally {
        await db.$disconnect();
      }
      execFileSync(process.execPath, [prismaCli, "migrate", "resolve", "--applied", "20261110203529_init"], { env, stdio: "pipe" });
      execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], { env, stdio: "pipe" });
      const migrated = createDatabase(url);
      try {
        expect(await migrated.studentCourse.findMany({
          orderBy: { id: "asc" },
          select: { id: true, source: true },
        })).toEqual([
          { id: "accepted", source: "TRANSCRIPT" },
          { id: "manual", source: "MANUAL" },
        ]);
        const tables = await migrated.$queryRawUnsafe<{ name: string }[]>(
          `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('transcripts', 'transcript_course_candidates')`,
        );
        expect(tables).toEqual([]);
        expect(await migrated.$queryRawUnsafe("PRAGMA foreign_key_check")).toEqual([]);
      } finally {
        await migrated.$disconnect();
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }, 30000);
});
