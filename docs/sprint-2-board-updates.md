# Proposed Sprint 2 issue and board updates

Prepared November 15, 2026. These updates have not been applied to GitHub.

## Existing issue #1: Manually enter completed courses

Keep the issue closed and its board status Done. Check the four implemented
acceptance criteria and the implementation/testing tasks. Leave teammate review
unchecked because the available evidence does not establish that review.

Append a Sprint 2 update linking the database story below and the
[published release](https://github.com/kgajula1-stack/NinerSkillsQuest/releases/tag/sprint-2).
Explain that completed courses now persist through the API, Prisma, and
PostgreSQL, with a fixed demo student and no authentication or account isolation.

## New issue: Sprint 2: Persist completed courses with Prisma and PostgreSQL

Assignee: `kgajula1-stack`, based on the implementation commit.
Final state: Closed as completed. Board status: Done.

### User story

As a student using the sample demo profile, I want completed courses saved in
PostgreSQL so that my courses and mapped skills remain available after
restarting the API.

### Acceptance criteria

- [x] Save a supported course in StudentCourse for the demo student.
- [x] Retrieve selections and mapped skills through CourseSkill relationships.
- [x] Reject duplicate selections and unknown course IDs.
- [x] Preserve selections after an API restart.
- [x] Remove only the selected student's course relationship and reject missing selections.
- [x] Display API/database failures in the interface.
- [x] Include the Prisma schema, migration, seed, and setup guide.
- [x] Include UML class and course-save sequence diagrams and an AI design review.
- [x] Publish a Sprint 2 tag and release of the tested implementation.

### Evidence

- Related story: #1.
- [Implementation commit](https://github.com/kgajula1-stack/NinerSkillsQuest/commit/d80ee0a).
- [Release at c5af211](https://github.com/kgajula1-stack/NinerSkillsQuest/releases/tag/sprint-2).
- [Database setup](https://github.com/kgajula1-stack/NinerSkillsQuest/blob/sprint-2/docs/database-setup.md).
- [API integration test](https://github.com/kgajula1-stack/NinerSkillsQuest/blob/sprint-2/tests/apiDatabase.integration.mjs).
- [UML diagrams](https://github.com/kgajula1-stack/NinerSkillsQuest/tree/sprint-2/docs/uml).

Release verification passed: 34 unit tests across 8 files, lint, and production
build. Database integration and local/Supabase smoke-test passes are recorded
in the repository; they were not rerun during publication. The API uses a
fixed demo student. Career goals remain browser-local.

## New issue: Sprint 2: Reconcile team database and submission evidence

Assignee: Unassigned until the team chooses an owner.
State: Open. Board status: In Progress.

### Acceptance criteria

- [ ] Confirm the team's shared or consistent local database setup.
- [ ] Reconcile the shared verification table with the individual evidence for
  Kaushal, Carter, and Jed; distinguish local verification from shared Supabase access.
- [ ] Link each member's meaningful Sprint 2 contribution to a commit or pull request.
- [ ] Update stale individual checklists where supporting evidence already exists.
- [ ] Update the Sprint 2 deliverables document with the published release and
  linked database story.
- [ ] Verify final submission links and evidence are accessible.

Carter and Jed have individual database test results and screenshots in their
contribution documents. The shared verification table still lists unnamed
teammates as pending; reconcile this discrepancy without claiming unverified
Supabase access or teammate review.

## New issue: Review recorded dependency audit findings

Assignee: Unassigned until the team chooses an owner.
State: Open. Board status: Todo.

### Acceptance criteria

- [ ] Run a fresh dependency audit and record current findings.
- [ ] Evaluate affected dependencies and runtime exposure.
- [ ] Apply compatible fixes and assess the reported Prisma major-upgrade requirement.
- [ ] Rerun unit tests, database integration tests, lint, and build after dependency changes.
- [ ] Document any remaining findings and the upgrade plan.

The Sprint 2 index records an earlier audit with 10 vulnerabilities: 7 moderate
and 3 high. Treat these as previously recorded findings until a fresh audit
confirms current status.

## Project board

Add the three new issues to the existing Niner Skills Quest project with the
statuses specified above. Preserve the historical Sprint 1 assignment for
issue #1. Inspect the Sprint field options before assigning the new items;
do not reuse Sprint 1 or invent sprint dates.

Leave other feature stories unchanged: some concern implementations on other
branches, which were not assessed in this database release review.
