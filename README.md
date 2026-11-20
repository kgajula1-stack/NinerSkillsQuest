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

For PostgreSQL and Prisma installation, local database creation, migrations,
seeding, and teammate setup, see
[docs/database-setup.md](./docs/database-setup.md).

To run the database-backed course workflow, start `npm run dev:api` in one
terminal and `npm run dev` in another.

## Commands

```sh
npm run build
npm test
npm run lint
```

The API/database integration test uses a PostgreSQL test database configured
with `DATABASE_URL_TEST`:

```sh
npm run test:db
```

The test uses a temporary student and removes it during cleanup. Point
`DATABASE_URL_TEST` at a test database, not a shared or production database.

Issue #14 verification: 44 unit tests pass across 9 files; the itinerary HTTP
adapter test, lint, and the TypeScript/Vite production build pass. The expanded
PostgreSQL integration test requires a migrated, seeded test database.

## Saved career itinerary (issue #9)

Configure `DATABASE_URL` for your development database, then apply the new
itinerary migration and seed the recommendations:

```sh
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

Start the API and Vite as described above. Start the demo, choose a career goal,
and open **Skill review**. Save a suggested course, project, or practice resource
using **Save to itinerary**. Open **Dashboard** to see its name, type, skill,
resource link, and **Remove** button. Saved activities reopen after refresh and
returning to the dashboard, independently of changes to your goal or courses.
Saving is immediate; **Save and continue** is not needed for itinerary activities.
Failures show retry instructions and **Reload itinerary** when needed.

On the Dashboard, use **Mark complete** or **Mark incomplete** on any saved
activity. Its text status and the completed/total count update after the save
succeeds and persist when you return or refresh. Completion is self-reported;
it does not award XP, a verified badge, or recorded skill mastery. Existing and
newly saved activities start incomplete. See the
[issue #15 review notes](./docs/issue_details/issue-15-test-results.md).

Use **Move earlier** / **Move later** to prioritize saved activities. The first
incomplete activity in your chosen order is labeled **Next activity**. Order
saves immediately and survives refresh; a failed save restores the previous
order. See the [issue #14 review notes](./docs/issue_details/issue-14-test-results.md).

The itinerary uses the API's existing fixed demo student. Storage is scoped by
student ID on the server; authenticated account selection remains future work.
Project suggestions are illustrative adapters while project recommendations are
developed separately. Project links open supporting learning material.

Run `npm run test:itinerary` for the HTTP tests with an in-memory database adapter.
See [issue #9 review and verification](./docs/issue_details/issue-9-test-results.md)
for acceptance coverage, database testing, and the manual review checklist.

## Usage

Select **Start local demo** to open the prototype. This is a browser-local demo
session, not identity verification or authentication. Use sample information
only. Sign out to return to the start screen; course and goal data remain in
this browser and are not isolated by a real account.

Search the supported demo courses by code or title, choose a result, and select
**Add course**. Remove individual selections at any time. With the API and
PostgreSQL running, completed courses persist through the Prisma API and mapped
skills are derived from their course relationships. API/database errors are
shown in the interface. The search field, course selector, add button, and
labeled remove buttons work with the keyboard; course and skill updates are
announced to assistive technology. Choose a career roadmap and one of the
generic Charlotte employer profiles in the career goal section. The demo
roadmaps are Backend Developer and Full-stack Developer; the current goal and
roadmap skill targets update immediately and persist in `localStorage`. The
roadmap and employer selectors are keyboard accessible. With a complete goal, the skill
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
employer endorsements. The demo session does not authenticate users or isolate one student's data
from another. The course API uses a fixed demo student; it is not suitable for
real student data. Career-goal persistence remains browser-local. Transcript
upload and other backend workflows are not included.

## AI-use disclosure

GitHub Copilot assisted with the course-entry and career-goal implementation,
tests, and project documentation. Figma MCP was used to access the referenced
design page and export its screenshot; it did not provide inspectable
goal-selection layers, so the career-goal UI follows existing application
patterns and the issue acceptance criteria rather than a verified frame
specification. The team should review the implementation and all illustrative
course mappings, roadmap targets, and employer profiles before treating them as
authoritative. No teammate review or approval is claimed here.
