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
