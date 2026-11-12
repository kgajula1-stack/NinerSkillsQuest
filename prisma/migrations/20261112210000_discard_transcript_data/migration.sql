PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE TABLE "new_student_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "completedAt" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_courses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_student_courses" ("id", "studentId", "courseId", "status", "completedAt", "source", "createdAt", "updatedAt")
SELECT sc."id", sc."studentId", sc."courseId", sc."status", sc."completedAt",
       CASE WHEN sc."transcriptCandidateId" IS NULL THEN 'MANUAL' ELSE 'TRANSCRIPT' END,
       sc."createdAt", sc."updatedAt"
FROM "student_courses" AS sc
LEFT JOIN "transcript_course_candidates" AS candidate ON candidate."id" = sc."transcriptCandidateId"
LEFT JOIN "transcripts" AS transcript ON transcript."id" = candidate."transcriptId"
WHERE sc."transcriptCandidateId" IS NULL
   OR (candidate."reviewStatus" = 'ACCEPTED'
       AND transcript."studentId" = sc."studentId"
       AND candidate."matchedCourseId" = sc."courseId");

DROP TABLE "student_courses";
ALTER TABLE "new_student_courses" RENAME TO "student_courses";
CREATE INDEX "student_courses_studentId_status_idx" ON "student_courses"("studentId", "status");
CREATE INDEX "student_courses_courseId_idx" ON "student_courses"("courseId");
CREATE UNIQUE INDEX "student_courses_studentId_courseId_key" ON "student_courses"("studentId", "courseId");

DROP TABLE "transcript_course_candidates";
DROP TABLE "transcripts";

COMMIT;
PRAGMA foreign_keys=ON;
