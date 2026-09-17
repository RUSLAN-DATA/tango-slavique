# Database

Cloudflare D1:

- name: `tango-slavique`
- database_id: `7a28698f-c6e0-46f0-93d5-8ee85bbf13a2`
- Worker binding: `DB`

Migrations live in `worker/migrations/` and are numbered. The initial schema is `0001_initial.sql`.

Tables: `users`, `sessions`, `profiles`, `applications`, `partner_preferences`, `photos`, `matches`, `match_responses`, `introductions`, `feedback`, `notifications`, `admin_notes`, `admin_actions`, `rate_limits`.

Photo binaries are stored in R2, not D1. D1 holds metadata only (`r2_key`, mime type, size, status).

Apply migrations:

```powershell
cd worker
npx wrangler d1 migrations apply tango-slavique --local
npx wrangler d1 migrations apply tango-slavique --remote
```

Do not `DROP DATABASE`. Do not put production data in migration files.
