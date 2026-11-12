-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "course_skills" (
    "courseId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    PRIMARY KEY ("courseId", "skillId"),
    CONSTRAINT "course_skills_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "completedAt" DATETIME,
    "transcriptCandidateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_courses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_courses_transcriptCandidateId_fkey" FOREIGN KEY ("transcriptCandidateId") REFERENCES "transcript_course_candidates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "career_roadmaps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "roadmap_skills" (
    "roadmapId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("roadmapId", "skillId"),
    CONSTRAINT "roadmap_skills_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "career_roadmaps" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "roadmap_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "industry" TEXT,
    "isIllustrative" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "student_career_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "roadmapId" TEXT,
    "employerProfileId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_career_goals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_career_goals_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "career_roadmaps" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "student_career_goals_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "employer_profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "transcripts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transcript_course_candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transcriptId" TEXT NOT NULL,
    "rawCourseCode" TEXT NOT NULL,
    "rawCourseTitle" TEXT,
    "matchedCourseId" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transcript_course_candidates_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "transcripts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transcript_course_candidates_matchedCourseId_fkey" FOREIGN KEY ("matchedCourseId") REFERENCES "courses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "course_recommendations_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "practice_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "practice_resources_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "course_skills_skillId_idx" ON "course_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "student_courses_transcriptCandidateId_key" ON "student_courses"("transcriptCandidateId");

-- CreateIndex
CREATE INDEX "student_courses_studentId_status_idx" ON "student_courses"("studentId", "status");

-- CreateIndex
CREATE INDEX "student_courses_courseId_idx" ON "student_courses"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "student_courses_studentId_courseId_key" ON "student_courses"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "career_roadmaps_name_key" ON "career_roadmaps"("name");

-- CreateIndex
CREATE INDEX "roadmap_skills_skillId_idx" ON "roadmap_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "employer_profiles_name_location_key" ON "employer_profiles"("name", "location");

-- CreateIndex
CREATE UNIQUE INDEX "student_career_goals_studentId_key" ON "student_career_goals"("studentId");

-- CreateIndex
CREATE INDEX "student_career_goals_roadmapId_idx" ON "student_career_goals"("roadmapId");

-- CreateIndex
CREATE INDEX "student_career_goals_employerProfileId_idx" ON "student_career_goals"("employerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_storageKey_key" ON "transcripts"("storageKey");

-- CreateIndex
CREATE INDEX "transcripts_studentId_uploadedAt_idx" ON "transcripts"("studentId", "uploadedAt");

-- CreateIndex
CREATE INDEX "transcript_course_candidates_transcriptId_reviewStatus_idx" ON "transcript_course_candidates"("transcriptId", "reviewStatus");

-- CreateIndex
CREATE INDEX "transcript_course_candidates_matchedCourseId_idx" ON "transcript_course_candidates"("matchedCourseId");

-- CreateIndex
CREATE INDEX "course_recommendations_skillId_sortOrder_idx" ON "course_recommendations"("skillId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "course_recommendations_skillId_code_key" ON "course_recommendations"("skillId", "code");

-- CreateIndex
CREATE INDEX "practice_resources_skillId_sortOrder_idx" ON "practice_resources"("skillId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "practice_resources_skillId_url_key" ON "practice_resources"("skillId", "url");
