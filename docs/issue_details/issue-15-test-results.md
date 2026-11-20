# Issue #15: Track completion of itinerary activities

Source: <https://github.com/kgajula1-stack/NinerSkillsQuest/issues/15>

Branch: `codex/issue-15-itinerary-completion`, based on the issue #9 itinerary
implementation for local review.

## Behavior

Saved courses, projects, and resources show Complete or Incomplete text plus
Mark complete / Mark incomplete controls. The dashboard shows completed/total
counts, including 0 of 0 for an empty loaded itinerary. Completed cards also
have a distinct border. Each completion action saves immediately through the
API; no separate save button is needed. Failures retain the last confirmed
state and provide retry instructions. Pending requests disable controls.

The new Prisma migration adds `completed`, defaulting to false, to existing
and new saved activities. PATCH `/api/itinerary/:recommendationId` accepts only
a boolean `completed` field and updates only the configured student's saved
activity. Retrying the same state is safe. Loading returns each persisted
completion value, so navigation, reload, and API restart retain progress.

Completion is explicitly self-reported. It updates only the saved activity;
it does not create badges, award XP, alter course records, or certify skills.
The existing fixed demo-student limitation still applies.

## Verification

| Check | Result |
| --- | --- |
| `npm test` | Pass: 42 tests across 9 files |
| `npm run test:itinerary` | Pass: HTTP integration with in-memory database adapter |
| `npm run db:generate` | Pass |
| `npm run build` | Pass |
| `npm run lint` | Pass |
| PostgreSQL `npm run test:db` | Extended; not run against the configured hosted database |

Acceptance coverage:

- Complete and undo: store and HTTP tests exercise both directions for saved
  activities; HTTP tests cover all three recommendation types.
- Distinguishable states: UI includes explicit Complete/Incomplete text and
  named action buttons, as well as a completed border treatment.
- Accurate counts: store tests cover empty, partial, reopened, undone, and
  removed completed activities. Failed saves leave counts unchanged.
- Persistence: a newly constructed store reloads completion; HTTP tests
  restart the server against a shared adapter and verify completion survives.
  PostgreSQL coverage now checks default state, completion, restart, and undo.
- No verified badge: completion writes only the student-scoped join record;
  the adapter exposes no reward operations and asserts only expected saved
  activity fields are changed. UI explains self-reported status.
- Failure and isolation: invalid values return 400; missing and another
  student's activities return 404. Database failures return 500 and support
  retry. Duplicate saves retain completion rather than resetting progress.

The adapter tests intentionally print simulated database failures. These are
expected in the passing test run.

## Review setup

Point `DATABASE_URL` to the development database you want to use and run:

```sh
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

Start `npm run dev:api` and `npm run dev` in separate terminals. Save a few
recommendations through Skill review and open Dashboard. Mark an activity
complete; check its text and count, navigate away and back, then refresh.
Undo completion and confirm it persists. Remove a completed activity and
confirm both counts change. Try the controls with the keyboard. Stop the API
and attempt an update: the confirmed state should remain, with retry feedback.
Restart the API and reload to recover.

No changes were applied to the configured Supabase database. Run `test:db`
against a separately migrated and seeded test database using `DATABASE_URL_TEST`.
Manual browser verification and teammate review remain pending; no teammate
approval is claimed.
