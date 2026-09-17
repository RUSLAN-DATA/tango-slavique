# Database

Cloudflare D1:

- name: `tango-slavique`
- database_id: `7a28698f-c6e0-46f0-93d5-8ee85bbf13a2`
- Worker binding: `DB`

Migrations live in `worker/migrations/` and are numbered. The initial schema is `0001_initial.sql`.

Tables: `users`, `sessions`, `profiles`, `applications`, `partner_preferences`, `photos`, `matches`, `match_responses`, `introductions`, `feedback`, `notifications`, `admin_notes`, `admin_actions`, `rate_limits`.

Photo binaries are stored in R2, not D1. D1 holds metadata only (`r2_key`, mime type, size, status). R2 keys look like `users/{userId}/{id}.jpg|png|webp`.

## D1 migration

```powershell
cd worker
npx wrangler d1 migrations list tango-slavique --remote
npx wrangler d1 migrations apply tango-slavique --remote
```

Apply remote migrations only when `migrations list` shows pending files. Do not drop the database. Do not put production data in migration files.

Local (optional):

```powershell
npx wrangler d1 migrations apply tango-slavique --local
```

## R2

- bucket: `tango-slavique-photos`
- Worker binding: `PHOTOS`
- Allowed uploads: JPEG, PNG, WEBP, max 10 MB
- Access is through authenticated Worker routes only. Do not make the bucket public.

## SQL

All application SQL uses bind parameters. Do not concatenate user input into queries.
