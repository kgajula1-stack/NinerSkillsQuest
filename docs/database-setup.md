# Sprint 2 database setup plan

## Current status

Sprint 2 database work has not started. The project currently uses Vite,
vanilla TypeScript, browser `localStorage`, and illustrative in-memory catalog
data. No database provider or ORM has been selected yet.

Do not add real credentials to this repository. Use `.env.example` as the
template for a future local configuration.

## Existing data that may require persistence

The current issues and implementation identify these application concepts:

- Completed courses selected by a student.
- Course-to-skill mappings.
- A selected career roadmap.
- A selected Charlotte employer profile.
- The resulting target skill profile.
- Learning recommendations for an unrecorded target skill.
- A local demo session, which is explicitly not real authentication.

The catalog, roadmap, employer, skill, and recommendation records are
illustrative application data. The team still needs to decide which of these
are database records and which remain seeded reference data.

## Decisions still required

Before generating ORM files or migrations, the team must decide:

1. Database technology and local development workflow.
2. ORM or SDK.
3. Whether a backend/API layer is required for the Vite frontend.
4. Which records belong to a student account.
5. Whether the shared development environment uses one database or matching
   local databases.
6. Seed data and migration ownership.

## Planned verification

After the database choice is approved, each team member will document:

| Team member | Operation | Result |
| --- | --- | --- |
| To be completed | Connect and create a test record | Pending |
| To be completed | Retrieve the test record | Pending |
| To be completed | Update or remove a test record | Pending |

Credentials and private connection details must not be included in this
table.

## Planned commands

The final database commands will be added after the team selects the database
and data-access technology. Until then, the current application remains
verified with:

```text
npm install
npm test
npm run build
```
