# PostgreSQL / Prisma 6 migration verification

Prepared from `databasetesting-jed` at `cdd4f2c` and the saved `origin/main`
at `dd90a1a`. Fetching current GitHub state failed because github.com could
not be resolved. The workspace checkout has an uncommitted merge of that main
snapshot; all conflicts are resolved and staged. Nothing was committed or pushed.
The original checkout under C:\Dev was not modified.

## Changes

- PostgreSQL schema based on main, with Prisma CLI/client pinned to 6.19.0.
- Main's initial PostgreSQL SQL migration retained byte-for-byte.
- Forward migration adds course availability and student-course status/source.
- Course API uses Prisma 6, UUID student identity and composite course key.
- Repeatable seed includes catalogs and the sample student without clearing selections.
- PostgreSQL integration tests use a separate `_test` database and unique schema.
- SQLite adapter, SQLite migrations, Prisma 7 config, and SQLite-only migration test removed.
- Setup, model, AI review, and UML sources updated. Outdated SVGs removed;
  render the revised UML sources before claiming assignment image completion.

## Verification performed

| Check | Result |
| --- | --- |
| Dependency installation | Passed with saved npm cache |
| PostgreSQL Prisma schema validation | Passed |
| Prisma 6.19 client generation | Passed using temporary explicit generator invocation |
| Browser tests | 8 files, 35 tests passed |
| TypeScript build check | Passed |
| Vite production build | Passed |
| Git conflict/whitespace check | Passed |
| Main's initial migration comparison | Unchanged |
| Credential tracking | .env ignored and untracked |
| PostgreSQL integration / migration execution | Not run: no configured PostgreSQL test database |

The sandbox returns EPERM for native realpath calls even on readable workspace
files. For verification only, the existing Prisma client generator was invoked
explicitly through a temporary schema targeting the normal client output, and
Vite used a temporary config with `resolve.preserveSymlinks: true`. These temporary
files and settings are not part of the migration. Standard generation/test/build
commands still need to be confirmed in the normal development environment.

## Run locally

Follow `database-setup.md` to create application and separate test databases.
Copy `.env.example` to `.env` only if no configured .env already exists; fill in
local credentials. Then run:

```powershell
npm install
npm run db:generate
npm run db:validate
npm run db:deploy
npm run db:seed
npm test
npm run test:db
npm run build
```

Start `npm run db:server` and `npm run dev` in separate terminals. Save courses,
restart the API, load courses, and verify removal. Team verification is still pending.
SQLite data files are not converted automatically; back up the old file and
re-enter the sample selections if needed.

## Applying the review patch to another checkout

The companion patch represents the complete resulting file changes relative to
`cdd4f2c`. Use it only on a clean checkout of that commit, without a merge already
in progress. First run `git apply --check <patch-path>`, then `git apply <patch-path>`.
It applies files without committing or pushing. It does not recreate this copy's
pending merge ancestry. If that checkout has advanced, review/reconcile its newer
changes before applying; do not reset or overwrite unrelated work.
