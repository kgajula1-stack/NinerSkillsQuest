-- Extend main's PostgreSQL schema without changing its initial migration.
ALTER TABLE "courses" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "student_courses"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';
