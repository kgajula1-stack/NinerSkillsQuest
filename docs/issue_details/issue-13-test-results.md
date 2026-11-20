# Issue #13: Explained career readiness score

Source: <https://github.com/kgajula1-stack/NinerSkillsQuest/issues/13>.
Branch: `codex/issue-13-readiness-score`, stacked on the completed issue #14
branch, which is based on issue #15. Each issue has its own local commit.

## Behavior

The Dashboard shows the selected roadmap and employer and a whole-percent
readiness score with matched/total distinct target-skill counts, a labeled
meter, and the formula. It uses the same skill-comparison rules as Skill
review: recorded course skill IDs and target IDs are deduplicated; unrelated
recorded skills do not count. A target is counted at most once.

The formula is `round(distinct matched targets / distinct targets * 100)`.
Three matches out of four targets produce 75%. Empty recorded inventory with
a valid goal yields 0%; full coverage yields 100%. A missing goal or empty
target set yields guidance and no numeric score. Loading and failed course
requests show status/recovery guidance rather than an unconfirmed score.

The score is derived on each render, so the existing goal and course-store
subscriptions update it after inventory or goal changes. No extra persistence
or migration is needed for #13; the score is recomputed from current data.
It measures recorded coverage, not verified mastery or hiring probability.
Marking itinerary items complete does not create recorded skills or raise it.

## Verification

| Check | Result |
| --- | --- |
| `npm test` | Pass: 50 tests across 10 files |
| `npm run build` | Pass |
| `npm run lint` | Pass |
| Issue #14 itinerary HTTP tests | Passed before adding #13; #13 does not change API behavior |

Readiness tests cover 75% for three of four targets, duplicate evidence and
targets, unrelated skills, 0%, 100%, rounding to 33%/67%, goal/inventory changes,
and missing/empty targets. Existing skill-gap and store tests remain passing.
UI labels, formula copy, goal display, error states, and subscriptions were
inspected in source. No browser QA or teammate approval is claimed.

## Manual review checklist (pending)

1. Start the API and Vite using the README instructions; open Dashboard.
2. With no goal, confirm guidance links to Career goal with no numeric score.
3. Choose a roadmap and employer; confirm both names and the explained score.
4. Add/remove recorded courses and change roadmaps. Compare matched/total counts
   with Skill review and verify the dashboard score updates.
5. Refresh and verify the same saved input data produces the same score.
6. Confirm the score does not change when marking itinerary activities complete.
7. Stop the API and refresh; verify recovery guidance instead of a numeric score.
8. Check keyboard navigation, meter label, and narrow-screen layout.

No database changes were applied. To use the stacked itinerary features,
apply their migrations to a chosen development database as documented in the
README. The existing fixed demo-student and browser-local career-goal
limitations remain. PostgreSQL integration and teammate review are pending.
