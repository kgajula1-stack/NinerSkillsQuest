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

## Provisional design decisions

These are planning notes, not approved implementation decisions:

- Course, skill, roadmap, employer, and recommendation catalogs may be seeded
  reference data.
- Student selections are the strongest candidates for persistent data.
- Completed courses and career goals should have stable identifiers and
  validation rules.
- Persistence should be separated from the current render logic and state
  stores.
- The local demo session must not be represented as verified university
  authentication.

## Decisions requiring team review

- Database provider and ORM/SDK.
- Backend or API boundary for database access.
- Student identity model and account isolation.
- Shared versus per-member development database.
- Migration and seed-data workflow.
- Error behavior when the database is unavailable.

No ORM, migration, database connection, or persistent feature has been
generated from these notes. The team must approve the decisions above before
implementation begins.
