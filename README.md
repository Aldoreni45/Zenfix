# ZenFix

ZenFix is a digital marketing agency management platform.

Architecture:

```
Next.js (frontend, http://localhost:3000)
        |
        | same-origin /api proxy
        v
Django REST Framework (http://127.0.0.1:8000)
        |
        v
MongoDB Atlas (PRIMARY database)
```

There is no SQLite operational database, no PostgreSQL, no MySQL, and no Redis.

## Requirements

- Python 3.10+ (developed with Python 3.13)
- Node.js 20+
- A MongoDB Atlas cluster (replica set)

## Backend (Windows / PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend/.env` and set `MONGODB_URI`, `MONGODB_DB`, and `DJANGO_SECRET_KEY`. Never commit `.env`.

```powershell
python manage.py migrate
python manage.py seed_data
python manage.py check
python manage.py runserver
```

Production WSGI:

```powershell
.\venv\Scripts\Activate.ps1
$env:DJANGO_SETTINGS_MODULE="zenfix.settings.production"
gunicorn -c gunicorn.conf.py
```

## Frontend (Windows / PowerShell)

```powershell
copy .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The admin portal is at `/adminzenfix/login`.

`DJANGO_BACKEND_URL` is a **server-only** variable used by the Next.js `/api` proxy. Do not prefix MongoDB or Django secrets with `NEXT_PUBLIC_`.

## MongoDB Atlas

1. Create a cluster and database user.
2. Allow your application IP (or a VPC peer) in Network Access.
3. Put the URI only in `backend/.env` as `MONGODB_URI`.
4. Set `MONGODB_DB=zenfix`.
5. If a connection string was ever committed, rotate the database user password immediately.

## Environment variables

See `backend/.env.example` and `.env.example`.

Required for the API:

- `MONGODB_URI`
- `MONGODB_DB`
- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS` (production)
- `CORS_ALLOWED_ORIGINS` (production)
- `CSRF_TRUSTED_ORIGINS` (production)

## Authentication and roles

Session authentication with CSRF. Roles: `owner`, `manager`, `employee`. Permissions are enforced on the server.

- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- `GET /api/auth/csrf/`

## API documentation

With the backend running:

- Swagger UI: http://127.0.0.1:8000/api/docs/
- OpenAPI schema: http://127.0.0.1:8000/api/schema/

Health:

- `GET /api/health/`
- `GET /api/health/ready/`

## Seed and legacy import

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py seed_data
python manage.py migrate_legacy_data
```

If `SEED_*_PASSWORD` variables are empty, development passwords are generated and printed only when `DJANGO_DEBUG=True`.

Set `SEED_DEMO_DATA=True` for sample clients/tasks.

## Tests

```powershell
cd backend
.\venv\Scripts\Activate.ps1
$env:DJANGO_SETTINGS_MODULE="zenfix.settings.testing"
python manage.py test
```

## Production notes

- Use `zenfix.settings.production` (`DEBUG=False`).
- Serve Django with gunicorn, not `runserver`.
- Terminate TLS at a reverse proxy; set `SESSION_COOKIE_SECURE=True` and `CSRF_COOKIE_SECURE=True`.
- Restrict CORS to real frontend origins. Never use `CORS_ALLOW_ALL_ORIGINS`.
- Collect static files (`whitenoise` is configured).
- Store video files via `StorageService` (local disk in development, object storage later). Do not store large binaries in MongoDB documents.

## Troubleshooting

- `MONGODB_URI is required`: copy `backend/.env.example` to `backend/.env`.
- Login CSRF 403: call `GET /api/auth/csrf/` first (the frontend client does this).
- Frontend 502: start Django on port 8000.
- Atlas IP mismatch: add the server IP in Atlas Network Access.

## Security

If MongoDB credentials were previously written into markdown files in this repository, treat them as compromised and rotate the Atlas user password. Credentials belong only in environment variables.
