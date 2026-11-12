# Sprint 2 database setup plan

## Phase 1 status

Phase 1 data-model analysis is complete. The project will use PostgreSQL with
Prisma as the ORM and a separate data-access layer. ORM generation, migrations,
and database connection code will follow this approved model.

The current browser demo still uses `localStorage` and illustrative TypeScript
catalog data. The model below defines the target persistence design; it does
not claim that database integration is complete.

## Selected persistence scope

### Persisted reference data

- Courses
- Skills
- Course-to-skill mappings
- Career roadmaps
- Roadmap-to-skill mappings
- Employers
- Learning recommendations

These records are seeded from the existing files in `src/data/`.

### Persisted student data

- Student profile
- Completed course selections
- Current career goal

### Derived data

The application will calculate current skills, matched target skills,
unmatched target skills, and the target skill profile from persisted
relationships. These values will not be stored separately, which avoids
duplicating data that can become inconsistent.

### Session-only data

Search text, draft course selection, selected recommendation UI state,
accessibility announcements, temporary messages, and the local demo sign-in
state are not database entities. The demo sign-in is not real authentication.

## Entity and attribute model

### Student

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | UUID or stable string | Primary key |
| `email` | string | Required and unique |
| `displayName` | string | Required |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

Real authentication is outside the current sprint scope. This entity provides
ownership for persisted student data.

### Course

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | stable string or UUID | Primary key |
| `code` | string | Required and unique |
| `title` | string | Required |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

### Skill

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | stable string or UUID | Primary key |
| `name` | string | Required and unique |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

### CourseSkill

This join entity maps courses to skills. Its composite primary key is
`(courseId, skillId)`, preventing duplicate mappings.

| Attribute | Type | Constraints |
| --- | --- | --- |
| `courseId` | foreign key | References `Course` |
| `skillId` | foreign key | References `Skill` |

### StudentCourse

This join entity records courses completed by a student. Its composite primary
key is `(studentId, courseId)`, preventing duplicate selections.

| Attribute | Type | Constraints |
| --- | --- | --- |
| `studentId` | foreign key | References `Student` |
| `courseId` | foreign key | References `Course` |
| `completedAt` | datetime | Required |
| `createdAt` | datetime | Required |

### CareerRoadmap

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | stable string or UUID | Primary key |
| `name` | string | Required and unique |
| `description` | string | Required |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

### RoadmapSkill

This join entity maps target skills to a career roadmap. Its composite primary
key is `(roadmapId, skillId)`.

| Attribute | Type | Constraints |
| --- | --- | --- |
| `roadmapId` | foreign key | References `CareerRoadmap` |
| `skillId` | foreign key | References `Skill` |

### Employer

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | stable string or UUID | Primary key |
| `name` | string | Required |
| `location` | string | Required |
| `industry` | string | Required |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

Employer records are illustrative demo data, not verified endorsements or
hiring requirements.

### StudentCareerGoal

Each student has at most one active goal in the current UI. Therefore,
`studentId` is the primary key for this entity.

| Attribute | Type | Constraints |
| --- | --- | --- |
| `studentId` | foreign key | Primary key; references `Student` |
| `roadmapId` | foreign key | References `CareerRoadmap` |
| `employerId` | foreign key | References `Employer` |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

Goal history is out of scope. A future version can add a separate goal ID and
an active/ended status if historical goals become necessary.

### Recommendation

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | UUID or stable string | Primary key |
| `skillId` | foreign key | References `Skill` |
| `title` | string | Required |
| `url` | string | Required |
| `type` | string or enum | Required |
| `createdAt` | datetime | Required |

Recommendation types currently represent electives and practice resources.

## Relationships

```text
Student 1 ──── 0..* StudentCourse 0..* ──── 1 Course
Course 1 ──── 0..* CourseSkill 0..* ──── 1 Skill
CareerRoadmap 1 ──── 0..* RoadmapSkill 0..* ──── 1 Skill
Student 1 ──── 0..1 StudentCareerGoal
CareerRoadmap 1 ──── 0..* StudentCareerGoal
Employer 1 ──── 0..* StudentCareerGoal
Skill 1 ──── 0..* Recommendation
```

## Current data-to-entity mapping

| Existing source | Persistence destination |
| --- | --- |
| `skills[]` in `src/data/catalog.ts` | `Skill` |
| `courses[]` in `src/data/catalog.ts` | `Course` |
| `course.skillIds[]` | `CourseSkill` |
| `careerRoadmaps[]` in `src/data/careerGoals.ts` | `CareerRoadmap` |
| `roadmap.skillIds[]` | `RoadmapSkill` |
| `employerProfiles[]` in `src/data/careerGoals.ts` | `Employer` |
| Recommendation data in `src/data/recommendations.ts` | `Recommendation` |
| `completedCourseIds` in `courseSelectionStore.ts` | `StudentCourse` |
| Selected roadmap and employer IDs | `StudentCareerGoal` |
| `targetProfile` and skill comparison results | Derived query results |

Stable IDs already used by the catalog, such as `backend-developer`, should
remain unchanged when the seed data is created.

## Integrity and deletion rules

- Deleting a student cascades to that student's `StudentCourse` and
  `StudentCareerGoal` records.
- Deleting a course, skill, roadmap, or employer is restricted when dependent
  records exist.
- Course-skill and roadmap-skill mappings may be changed only as intentional
  catalog maintenance.
- Reference records should normally be updated or retired rather than
  casually deleted.
- Foreign keys and unique constraints must be enforced by the database, not
  only by the UI.

## First database-integrated user story

> As a student, I want to save completed courses so that my selected courses
> and mapped skills remain available after restarting the application.

Acceptance criteria:

1. A valid course can be saved for a student.
2. The selection is stored in `StudentCourse`.
3. A duplicate course cannot be selected twice for the same student.
4. Saved courses can be retrieved after restarting the application.
5. Course skills are loaded through `CourseSkill`.
6. Removing a course changes only that student's selection.
7. An unknown course ID is rejected.
8. Database failures produce a visible error message.

## Team verification table

Complete this table after database integration is implemented. Do not include
credentials or private connection strings.

| Team member | Operation | Result |
| --- | --- | --- |
| To be completed | Create a test course selection | Pending |
| To be completed | Retrieve a saved selection | Pending |
| To be completed | Update or remove a selection | Pending |

## Database choice

The team selected PostgreSQL with Prisma because the application has normalized
relationships between students, courses, skills, roadmaps, employers, and
recommendations. PostgreSQL provides foreign keys and composite constraints,
while Prisma provides typed access, migration files, and a reproducible seed
workflow.

Each developer should run PostgreSQL locally or through Docker. A shared
development database may be configured later, but credentials must remain in a
local `.env` file and never in Git.

## Teammate installation and local setup

These steps create the same database structure and seed data on each
teammate's computer. They do not give a teammate access to the PostgreSQL
server running on another computer.

### 1. Install prerequisites

Install Node.js 22.12 or newer, Git, and PostgreSQL 17. On Windows,
PostgreSQL can be installed with:

```powershell
winget install --id PostgreSQL.PostgreSQL.17 --exact `
  --accept-package-agreements --accept-source-agreements
```

During PostgreSQL installation, each teammate must choose and remember a local
password for the `postgres` user. The password may be different on each
computer.

Confirm that the PostgreSQL service is running:

```powershell
Get-Service -Name postgresql-x64-17
```

Confirm the command-line client is available:

```powershell
psql --version
```

### 2. Clone and install the project

```powershell
git clone https://github.com/kgajula1-stack/NinerSkillsQuest.git
cd NinerSkillsQuest
npm install
```

### 3. Create a local database

Set `PGPASSWORD` only for the current PowerShell session and replace the
placeholder with the password selected during PostgreSQL installation:

```powershell
$env:PGPASSWORD="your-local-postgres-password"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" `
  -h localhost -U postgres -d postgres `
  -c "CREATE DATABASE niner_skills_quest;"
```

If the database already exists, PostgreSQL will report that it exists; this is
safe to ignore.

### 4. Configure the local environment

Copy `.env.example` to `.env` and replace the password placeholder:

```powershell
Copy-Item .env.example .env
```

The local file should contain a connection string in this format:

```env
DATABASE_URL="postgresql://postgres:your-local-postgres-password@localhost:5432/niner_skills_quest"
```

Never commit `.env`, paste its contents into an issue, or include it in a
screenshot. Verify that Git ignores it:

```powershell
git check-ignore -v .env
git ls-files .env
```

The first command should show the `.gitignore` rule. The second command should
produce no output.

### 5. Generate and initialize Prisma

Run the following commands from the repository root:

```powershell
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run build
```

`npm run db:migrate` applies the committed Prisma migrations. The seed command
loads the illustrative catalog, roadmap, employer, and recommendation data.
The seed is repeatable and uses upserts for reference records.

### 6. Verify access

Check the database through the PostgreSQL CLI:

```powershell
$env:PGPASSWORD="your-local-postgres-password"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" `
  -h localhost -U postgres -d niner_skills_quest `
  -c "\dt"
```

Or open Prisma Studio:

```powershell
npm run db:studio
```

Open [http://localhost:5555](http://localhost:5555), then stop Prisma Studio
with `Ctrl+C` when finished.

## Accessing the database built on another computer

The current database is a local PostgreSQL instance on the owner's computer.
`localhost` always means the computer running the command, so a teammate's
`.env` cannot use `localhost` to reach this database.

For normal team development, use one of these approaches:

1. **Recommended:** create a shared no-cost development PostgreSQL database
   through an approved provider, then share its connection details through a
   secure channel. Each teammate uses the same committed migrations and seed
   command.
2. **Local-only development:** each teammate creates a local database by
   following the setup above. This is appropriate until a shared development
   server is approved.

Do not expose a home computer's PostgreSQL port to the public internet. Do not
commit a shared connection string, password, private key, or service-account
credential. If the team later selects a shared provider, document only the
provider, database name, non-secret variable names, and connection procedure
here; distribute the actual secret separately.

## Prisma workflow for schema changes

When the schema changes:

```powershell
npm run db:migrate -- --name describe-your-change
npm run db:generate
npm run db:seed
```

Commit `prisma/schema.prisma` and the new `prisma/migrations/` directory.
Teammates then pull the changes and run:

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

Do not edit an existing migration that has already been applied. Create a new
migration for each schema change.
