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

## TanStack Router File-Based Routing

This project uses TanStack Router with file-based routing. **CRITICAL RULES**:

### Flat Routes with Underscore `_`
To create sibling routes (not nested), use `_` in the filename to break the hierarchy:

```
app.courses.tsx         → /app/courses (MyCourses list)
app.courses_.$slug.tsx  → /app/courses/$slug (CoursePlayer - SIBLING, not child)
app.courses_.$slug_.$lessonSlug.tsx → /app/courses/$slug/$lessonSlug (LessonView)
```

The underscore `_` breaks nesting. Without it, `app.courses.$slug.tsx` would be a CHILD of `app.courses.tsx` and require an `<Outlet />`.

### Route ID vs URL Path
- Route ID includes underscores: `/app/courses_/$slug_/$lessonSlug`
- URL path is clean: `/app/courses/$slug/$lessonSlug`
- `useParams()` MUST use the route ID: `useParams({ from: '/app/courses_/$slug_/$lessonSlug' })`

### When Renaming Route Files
**ALWAYS do ALL of these steps** after renaming/creating/deleting route files:
```bash
# 1. Delete stale routeTree
rm frontend/src/routeTree.gen.ts

# 2. Kill ALL dev servers
pkill -9 -f vite; pkill -9 -f "bun.*dev"

# 3. Start fresh
cd frontend && bun dev
```

# 4. Tell user to HARD REFRESH browser (Cmd+Shift+R / Ctrl+Shift+R)

**ALL FOUR STEPS ARE REQUIRED.** Skipping any step causes 404 errors or stale cached routes.

## Tailwind CSS v4 Notes

This project uses **Tailwind CSS v4** which has syntax changes from v3:

- **CSS variable references**: Use parentheses `()` not brackets `[]`
  - Old (v3): `w-[--sidebar-width]`, `bg-[--my-color]`
  - New (v4): `w-(--sidebar-width)`, `bg-(--my-color)`

- **Color format**: Theme colors use `oklch()` format in CSS variables

- **Config location**: Theme config is in `src/index.css` using `@theme inline` block, not `tailwind.config.js`
