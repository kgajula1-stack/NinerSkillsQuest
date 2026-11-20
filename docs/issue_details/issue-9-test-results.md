# Issue #9: Save and reopen a personalized career itinerary

Implemented locally on `codex/issue-9-career-itinerary` for review.
Source: <https://github.com/kgajula1-stack/NinerSkillsQuest/issues/9>.

## Implementation

- Skill review offers save controls for the existing course/resource catalog and
  illustrative project adapters. Stable recommendation IDs match the seed data.
- Dashboard lists saved activity names, types, associated skills, available links,
  and remove controls. Saving does not mark courses completed or change skill gaps.
- Prisma stores a student/recommendation join with a composite primary key.
  The API scopes every read/write to its configured student; clients cannot
  choose a student ID. Idempotent save/remove operations support safe retries.
- Pending requests disable controls. Successful operations confirm the change;
  failures preserve the last confirmed list and provide retry instructions.
- Goal changes do not filter or delete saved activities. Ordering and completion
  workflows are outside this issue.

## Automated results

| Check | Result |
| --- | --- |
| `npm test` | Pass: 39 tests, 9 files |
| `npm run test:itinerary` | Pass: HTTP contract with shared in-memory database adapter |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| `npm run db:generate` | Pass |
| Expanded `npm run test:db` | Added; not run against PostgreSQL in this change |

The HTTP test deliberately triggers a database failure; the expected server error
is printed before the passing result.

| Acceptance criterion | Automated coverage |
| --- | --- |
| Add a recommended course, project, or resource | Catalog adapter checks all three types; HTTP saves all three |
| Show name, type, skill, and resource link | Catalog metadata assertions and store response validation; UI renders these fields |
| Remove activities and prevent duplicate saves | Store suppresses duplicate requests; HTTP duplicate/retry and removal checks; database composite key |
| Report success or actionable failure | Store checks save success, failed save/remove, invalid response, reload, and retry |
| Reopen saved activities after returning/refresh | New store loads saved data; HTTP server restart keeps adapter data; two configured students have separate lists |

These tests verify data and API behavior; they do not claim visual browser QA.

## Database and browser review

The configured development database is hosted on Supabase. It was left unchanged
for local review. Apply migrations and seed to a chosen development database
before trying the feature. For PostgreSQL verification, use a dedicated test
database, deploy migrations and seed with `DATABASE_URL` pointing there, and run
`npm run test:db` with `DATABASE_URL_TEST` set to that same database. The expanded
test saves all three types, rejects duplicates, restarts the server, reloads the
saved activities, and removes them. Its temporary student is cleaned up.

Manual review checklist (pending):

1. Start API and Vite; enter the demo and choose a roadmap/employer.
2. Open Skill review. Save one course, project, and resource. Confirm each success
   message and disabled Saved button, using keyboard controls as well as a mouse.
3. Open Dashboard. Check all metadata and links; navigate away and back, refresh,
   and sign out/reenter the demo. Confirm the same saved activities reopen.
4. Change the goal and confirm saved activities remain. Remove an activity,
   refresh, and confirm it stays removed and can be saved again.
5. Stop the API; try a save/removal. Confirm failure feedback and that the list
   retains confirmed data. Restart the API, reload, and retry successfully.
6. Review narrow-screen layout and screen reader announcements.

## Remaining review / limitations

Teammate review and manual browser verification are pending; no approval is
claimed. Real authentication is not available in this repository: the running
demo uses the same fixed student as the course API. Tests exercise server-side
student scoping through injected student IDs, not authenticated user sessions.
Course availability and project suggestions are illustrative. Project links
point to supporting resources rather than a dedicated project-detail page.
