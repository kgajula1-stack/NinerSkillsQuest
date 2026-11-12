# Persistence model

The authoritative implementation is `prisma/schema.prisma`: PostgreSQL with
Prisma 6.19.0. See `database-setup.md` for entities, relationships, setup,
constraints, migration instructions, and the team verification table.

Main's initial PostgreSQL migration is preserved. A second migration adds
`Course.isActive` and `StudentCourse.status/source`. Student IDs are UUIDs;
student/course pairs use a composite primary key. Manual saves affect only
COMPLETED/MANUAL rows for the fixed sample student. Other workflows are preserved.
The row lock serializes whole-list saves; the last successful save wins.
Status/source strings are service-level conventions, not PostgreSQL enums.

The seed loads catalog references, roadmap/employer/recommendation data and one
sample student using repeatable upserts. It preserves student selections.
Skills reflect possible course exposure, not verified mastery. Career goals
are represented in the schema but still stored only in browser storage by the UI.
Transcript files and extracted candidates have no storage tables in this model.
