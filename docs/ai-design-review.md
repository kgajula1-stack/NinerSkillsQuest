# Sprint 2 AI design review

## Scope reviewed

The current Sprint 1 application was reviewed against the existing user
stories, Figma MCP context, source tree, and tests. The application is a Vite
and vanilla TypeScript browser demo.

Known implemented concepts include:

- Completed-course search, selection, duplicate prevention, removal, and
  mapped-skill display from Issue #1.
- Career roadmap and Charlotte employer selection with persistence from Issue
  #2.
- Recorded-skill and target-skill comparison from Issue #3.
- Learning recommendations for an unrecorded target skill from Issue #4.
- A clearly labeled local demo session rather than real authentication.

## Phase 1 reviewed design decisions

- Course, skill, roadmap, employer, and recommendation catalogs are reference
  records that will be seeded.
- Student profiles, completed courses, and the current career goal are
  student-owned persisted data.
- Current skills, target profiles, and skill-gap results are derived from
  relationship queries rather than stored redundantly.
- Persistence will be separated from render logic and state stores.
- The local demo session is not verified university authentication and will
  remain outside the persistent domain model.
- The current UI supports one active career goal per student, so
  `StudentCareerGoal.studentId` is its primary key.
- Composite keys on `StudentCourse`, `CourseSkill`, and `RoadmapSkill` prevent
  duplicate relationships.

## AI-generated design decision reviewed and corrected

The initial design represented roadmap skill IDs as an array directly on a
roadmap record. The team corrected this to a normalized `RoadmapSkill` join
entity.

The corrected design allows a skill to belong to multiple roadmaps, enforces
foreign-key integrity, prevents duplicate roadmap-skill mappings, and supports
relationship queries without storing a serialized array. The same normalized
approach is used for course-to-skill mappings and student course selections.

## PostgreSQL migration implementation review

The branch originally used Prisma 7 and SQLite, while main introduced a different
PostgreSQL schema with Prisma 6. The reconciliation preserves main's initial
PostgreSQL migration and ten-model design, and adds a forward migration for
`Course.isActive` and `StudentCourse.status/source`. The course API now uses
Prisma 6's generated client, UUID sample identity, and composite student/course
key. It keeps other workflows separate and locks the student's row during
whole-list replacements. The seed uses upserts without resetting selections.

Database tests now use a separate PostgreSQL database and a unique disposable
schema instead of SQLite files. Schema/model design and test execution are
separate evidence; see database setup and migration verification for results.

Team verification, real authentication, shared development credentials, and
production deployment remain open. This AI-assisted migration does not claim
new teammate review or approval.
