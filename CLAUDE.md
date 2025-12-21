# Project Rules for Claude

## FINISH TASKS COMPLETELY

**DO NOT half-finish tasks.** When you make changes, follow through to completion:

1. **Migrations**: If you modify Django models, ALWAYS run migrations:
   ```bash
   docker compose exec web python manage.py makemigrations
   docker compose exec web python manage.py migrate
   ```

2. **Dependencies**: If you add packages, install them:
   - Backend: `docker compose exec web pip install <package>`
   - Frontend: `cd frontend && bun install`

3. **Restart services**: If you change code that requires a restart, restart the service.

4. **Verify your changes work**: After making changes, verify they actually work before saying you're done.

## Project Structure

- **Backend**: Django app in `backend/`, runs in Docker as `web` service
- **Frontend**: React/Vite app in `frontend/`, uses Bun
- **Docker**: Services defined in `compose.yaml`

## Common Commands

```bash
# Django migrations
docker compose exec web python manage.py makemigrations
docker compose exec web python manage.py migrate

# Restart Django
docker compose restart web

# Frontend dev
cd frontend && bun dev
```

## Dev Server Management

**ALWAYS kill existing dev servers before starting a new one.** Port conflicts cause ERR_CONNECTION_RESET errors.

```bash
# Kill stale vite/bun processes before starting dev server
pkill -f "vite" 2>/dev/null; pkill -f "bun.*dev" 2>/dev/null

# Then start fresh
cd frontend && bun dev
```

If the user reports connection errors (ERR_CONNECTION_RESET, wrong port), kill all processes and restart.

## Tailwind CSS v4 Notes

This project uses **Tailwind CSS v4** which has syntax changes from v3:

- **CSS variable references**: Use parentheses `()` not brackets `[]`
  - Old (v3): `w-[--sidebar-width]`, `bg-[--my-color]`
  - New (v4): `w-(--sidebar-width)`, `bg-(--my-color)`

- **Color format**: Theme colors use `oklch()` format in CSS variables

- **Config location**: Theme config is in `src/index.css` using `@theme inline` block, not `tailwind.config.js`
