# SAP Clone Backend

FastAPI service backed by Supabase Auth and Postgres.

## Setup

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env
```

Fill `.env` with your Supabase project values:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

The anon key is used to verify user JWTs. The service-role key is used only by
the backend for server-side database operations and must never be exposed to
the browser.

Apply the database schema from `supabase/migrations/20261125130000_initial_schema.sql`
using the Supabase SQL editor or the Supabase CLI:

```powershell
supabase db push
```

Optional local data:

```powershell
supabase db reset
```

## Run

```powershell
cd backend
.\.venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

## Tests

```powershell
cd backend
.\.venv\Scripts\python -m pytest -q
```

## Endpoints

Public:

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Service info |
| GET | `/api/v1/health` | Health/configuration status |
| POST | `/api/v1/auth/signup` | Supabase e-mail sign-up |
| POST | `/api/v1/auth/signin` | Supabase e-mail sign-in |
| POST | `/api/v1/auth/recover` | Password recovery e-mail |

Authenticated (`Authorization: Bearer <supabase-access-token>`):

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/auth/me` | Current user and profile |
| GET | `/api/v1/profile` | Profile |
| PATCH | `/api/v1/profile` | Update profile fields |
| GET | `/api/v1/profile/preferences` | E-mail preferences |
| PUT | `/api/v1/profile/preferences` | Replace e-mail preferences |
| GET | `/api/v1/profile/interests` | Selected products |
| PUT | `/api/v1/profile/interests` | Replace selected products |
| GET | `/api/v1/dashboard` | Dashboard summary |
| GET | `/api/v1/inbox` | Inbox messages |
| PATCH | `/api/v1/inbox/{message_id}` | Mark message as read |

## Security notes

- All user tables have RLS policies keyed to `auth.uid()`.
- The profile row is created automatically from `auth.users` by a trigger.
- Passwords are handled only by Supabase Auth; the backend never stores them.
- CORS allows `http://localhost:3000` by default; configure `CORS_ORIGINS` for deployment.
