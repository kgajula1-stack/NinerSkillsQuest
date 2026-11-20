# Issue #14: Prioritize itinerary activities

Branch: `codex/issue-14-itinerary-ordering`, based on issue #15.
Source: <https://github.com/kgajula1-stack/NinerSkillsQuest/issues/14>.

## Behavior and storage

Dashboard activities have labeled Move earlier / Move later buttons when there
are two or more saved activities. Boundary moves are disabled. Reordering is
immediate, saves automatically, and retains completion state. Failed requests
restore the previous confirmed order with retry instructions. Keyboard focus
returns to the moved activity's completion control after saving.

The first incomplete activity in the displayed order is labeled Next activity;
there is no next activity when all are complete. Empty and single-item plans
have no reorder buttons. Newly saved recommendations append to the end;
duplicate saves do not reset ordering or completion.

The migration adds a position column and assigns existing rows positions using
their previous created-at/ID ordering. GET sorts by position with deterministic
tie breakers. PATCH `/api/itinerary/order` accepts the exact list of the current
student's saved recommendation IDs. Duplicate, omitted, unknown, and another
student's IDs cannot modify the list. All position updates occur in one
serializable transaction. Concurrent changes may require reload/retry.

## Verification

| Check | Result |
| --- | --- |
| Unit tests | Pass: 44 tests across 9 files |
| `npm run test:itinerary` | Pass using in-memory database adapter |
| Prisma client generation | Pass |
| Production build and lint | Pass |
| PostgreSQL integration | Extended to assert chosen order after restart; not run |

Tests cover optimistic moves, saved/reopened order, rollback on failure,
completion preservation, empty/single/boundary/unknown moves, exact-list
validation, student isolation, and HTTP restart persistence. UI labels and
focus handling were inspected in source; browser QA remains pending.

## Review setup

Apply migrations to your chosen development database with
`npm run db:migrate:deploy`, regenerate the client with `npm run db:generate`,
and seed recommendations if needed with `npm run db:seed`. Start the API and
Vite, save at least three activities, then reorder on Dashboard. Confirm the
next incomplete item, navigate away/back, refresh, and verify order persists.
Check both boundaries and keyboard operation. Stop the API, attempt a move,
and confirm rollback and retry feedback. Also check zero and one saved item.

The configured Supabase database was left unchanged. The app retains its
fixed demo-student limitation. Teammate review and manual browser verification
remain pending; no approval is claimed.
