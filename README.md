# Niner Skills Quest

A local demo for selecting completed courses and seeing their suggested skills.
Students can also choose an illustrative career roadmap and Charlotte employer
to define a local career goal. Course and roadmap skills represent possible
exposure or targets, not verified skill mastery.

## Setup

Requires Node.js 22.12+.

```sh
npm install
npm run dev
```

Vite prints a local URL after the development server starts.

## Commands

```sh
npm run build
npm test
```

## Database workflow

The completed-course screen can explicitly save its current list to a local
SQLite database and load it back. The normal browser-local workflow still works
without the database server. Set up the database once from the project root:

```powershell
Copy-Item .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
```

In separate terminals, run `npm run db:server` and `npm run dev`, then open
the Vite URL at `http://localhost:5173`. On the courses screen, use **Save
courses to database** to replace the shared sample student's saved list, or
**Load courses from database** to replace the browser list. Remove a course
and save again to delete it from the database; saving an empty list clears it.
These actions are explicit: the existing **Save and continue** button does not
save to the database. Database failures are displayed on the course screen.

The seed creates a sample student and the illustrative courses, skills, and
course-skill mappings from the existing catalog. It can be rerun without
resetting the student's saved courses. All database users share one sample
student; there is no authentication or privacy isolation. Use sample data
only. Concurrent saves are last-write-wins. The API binds to loopback and is
for this local demo only, not production or network deployment. The API
expects Vite on port 5173 and is not included in the static build or preview.
Career goals remain in browser storage.

The schema, migration, and relationships are documented in
[docs/data-model.md](./docs/data-model.md).

## Sprint 1 verification

The Sprint 1 implementation covers completed-course entry and career-goal
selection. Run the following commands from a fresh checkout to verify the
submission:

```sh
npm install
npm run db:generate
npm test
npm run build
```

The tests include an isolated SQLite integration workflow. The production
build includes TypeScript checking. Configure `.env` as shown above before
running `db:generate`.

## Usage

Select **Start local demo** to open the prototype. This is a browser-local demo
session, not identity verification or authentication. Use sample information
only. Sign out to return to the start screen; course and goal data remain in
this browser and are not isolated by a real account.

Search the supported demo courses by code or title, choose a result, and select
**Add course**. Remove individual selections at any time. Mapped skills update
immediately, are deduplicated across selected courses, and are derived from
course IDs saved in browser `localStorage`. If browser storage is unavailable or
saved data is invalid, the app displays a message and keeps selections usable for
the current session. The search field, course selector, add button, and labeled
remove buttons work with the keyboard; course and skill updates are announced to
assistive technology. Choose a career roadmap and one of the generic Charlotte
employer profiles in the career goal section. The demo roadmaps are Backend
Developer and Full-stack Developer; the current goal and roadmap skill
targets update immediately and persist in `localStorage`. The roadmap and
employer selectors are keyboard accessible. With a complete goal, the skill
comparison separates course-mapped target matches from targets not recorded by
the current course list. Unmatched targets are not treated as proof of missing
ability. A target skill not recorded by courses can be selected to see a
curated learning resource and a topic to investigate in the official UNC
Charlotte catalog. Catalog topics are suggestions, not confirmed current
elective offerings; check the current catalog and prerequisites.

The course-entry screen follows the supplied Figma course panel. The project or
experience tab and in-progress status are shown only as disabled visual context;
this feature handles completed courses only.

## Assignment evidence

Shared links and assignment resources are collected in
[docs/assignment-deliverables.md](./docs/assignment-deliverables.md).
Individual contribution details are documented in
[docs/kaushal-details.md](./docs/kaushal-details.md). Shared screenshots and
project evidence are included in [docs/assignment-deliverables.md](./docs/assignment-deliverables.md).

Screenshots include:

- [Completed-course workflow](./docs/screenshots/issue-1-completed-courses.png)
- [Career-goal selection](./docs/screenshots/issue-2-career-goal.png)
- [Skill comparison](./docs/screenshots/issue-3-skill-comparison.png)
- [Local demo session](./docs/screenshots/issue-5-demo-session.png)
- [GitHub Issues](./docs/screenshots/githubIssues.png)
- [Sprint 1 Project board](./docs/screenshots/githubProjectboard.png)
- [Copilot account verification](./docs/screenshots/copilotaccountverification.png)
- [Copilot functionality](./docs/screenshots/copilotVerfication.png)

The evidence document also contains the repository, GitHub Project, Figma,
issue, pull request, test, and build links required for the lab submission.

## Limitations

The course catalog and mappings are illustrative, not official catalog data.
Coursework suggestions are not verified mastery, and roadmap skill targets and
employer profiles are fictional demo data, not verified hiring requirements or
employer endorsements. The demo session does not authenticate users or isolate
one student's data from another. Transcript upload and production backend
services are not included yet.

## AI-use disclosure

GitHub Copilot assisted with the course-entry and career-goal implementation,
tests, and project documentation. Figma MCP was used to access the referenced
design page and export its screenshot; it did not provide inspectable
goal-selection layers, so the career-goal UI follows existing application
patterns and the issue acceptance criteria rather than a verified frame
specification. The team should review the implementation and all illustrative
course mappings, roadmap targets, and employer profiles before treating them as
authoritative. No teammate review or approval is claimed here.