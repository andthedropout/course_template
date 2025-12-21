# Developer Guide

Quick reference for developers using this course selling template.

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services (including Saleor e-commerce)
docker compose --profile saleor up -d

# 3. Create Django superuser
docker compose exec web python manage.py createsuperuser
```

**Access Points:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5847 |
| Django Admin | http://localhost:8847/admin/ |
| Saleor Dashboard | http://localhost:9800 |
| Saleor GraphQL | http://localhost:8800/graphql/ |
| Mailpit (emails) | http://localhost:8825 |

---

## Repurposing for a New Project

### 1. Rename the project

```bash
# Update these in .env
COMPOSE_PROJECT_NAME=myproject      # Docker container naming
VITE_PROJECT_NAME=myproject         # MUST match COMPOSE_PROJECT_NAME
```

**Important:** `VITE_PROJECT_NAME` must match `COMPOSE_PROJECT_NAME` because cookies are prefixed with the project name (e.g., `myproject_csrftoken`).

### 2. Generate new secrets

```bash
# Generate a new secret key
./run secret

# Update in .env
SECRET_KEY=<your-new-secret>
SALEOR_WEBHOOK_SECRET=<generate-a-new-one>
```

### 3. Reset database (if needed)

```bash
docker compose down -v  # Removes volumes
docker compose --profile saleor up -d
```

---

## Saleor E-commerce Setup

### First-Time Setup

1. **Reset Saleor admin password:**

```bash
docker compose exec saleor-api python manage.py shell -c "
from saleor.account.models import User
u = User.objects.filter(is_superuser=True).first()
u.set_password('admin')
u.save()
print(f'Password reset for: {u.email}')
"
```

2. **Login to Saleor Dashboard:** http://localhost:9800

3. **Create a sales channel** (if not exists):
   - Settings → Channels → Create Channel
   - Use slug: `default-channel` (matches `VITE_SALEOR_CHANNEL` in .env)

---

## Webhook Configuration

The webhook connects Saleor orders to Django course enrollments. **One-time setup:**

### Via Saleor GraphQL Playground (http://localhost:8800/graphql/)

1. **Create the app:**

```graphql
mutation {
  appCreate(input: {
    name: "Course Enrollment"
    permissions: [MANAGE_ORDERS]
  }) {
    app { id }
    authToken
    errors { message }
  }
}
```

2. **Create the webhook** (use the auth token from above):

```graphql
mutation {
  webhookCreate(input: {
    name: "Order Paid - Enroll User"
    targetUrl: "http://host.docker.internal:8847/api/v1/courses/webhooks/saleor/"
    events: [ORDER_FULLY_PAID]
    app: "<APP_ID_FROM_STEP_1>"
    secretKey: "<SALEOR_WEBHOOK_SECRET_FROM_ENV>"
  }) {
    webhook { id }
    errors { message }
  }
}
```

**Note:** Use `host.docker.internal` so Saleor (in Docker) can reach Django (also in Docker).

---

## Creating Courses

### Step 1: Create Product in Saleor

1. Go to Saleor Dashboard → Catalog → Products → Create Product
2. Fill in name, description, price
3. **Copy the product ID** from the URL: `/products/UHJvZHVjdDox` → ID is `UHJvZHVjdDox`

### Step 2: Create Course in Django

**Option A: Django Admin**

1. Go to http://localhost:8847/admin/courses/course/
2. Create course, set `saleor_product_id` to match Saleor
3. Add modules, add lessons to modules
4. Set status to "published"

**Option B: Django Shell**

```python
docker compose exec web python manage.py shell

from courses.models import Course, Module, Lesson

course = Course.objects.create(
    title="My Course",
    slug="my-course",
    description="Course description",
    saleor_product_id="UHJvZHVjdDox",  # From Saleor
    status="published"
)

module = Module.objects.create(
    course=course,
    title="Module 1",
    order=1
)

Lesson.objects.create(
    module=module,
    title="Lesson 1",
    slug="lesson-1",
    content="<p>Lesson content here</p>",
    order=1
)
```

---

## Purchase → Enrollment Flow

```
Customer browses /store
         ↓
Adds course to cart → Checkout → Pays (Stripe)
         ↓
Saleor creates order → Fires ORDER_FULLY_PAID webhook
         ↓
Django webhook handler (courses/webhooks.py):
  1. Verifies webhook signature (HMAC-SHA256)
  2. Finds or creates user by email
  3. Looks up Course by saleor_product_id
  4. Creates Enrollment record
  5. Sends welcome email (if new user created)
         ↓
User logs in → Sees course in /app/dashboard
```

---

## Key Files Reference

| Purpose | Location |
|---------|----------|
| Course models | `backend/courses/models.py` |
| Webhook handler | `backend/courses/webhooks.py` |
| Course permissions | `backend/courses/permissions.py` |
| Course API views | `backend/courses/views.py` |
| Saleor GraphQL client | `frontend/src/api/saleor/client.ts` |
| Cart hook | `frontend/src/hooks/useCart.ts` |
| Store pages | `frontend/src/pages/store/` |
| App dashboard | `frontend/src/pages/app/` |
| App layout | `frontend/src/components/app/` |
| Cookie helper | `frontend/src/lib/getCookie.ts` |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `COMPOSE_PROJECT_NAME` | Docker container/volume naming |
| `VITE_PROJECT_NAME` | Cookie prefix (must match COMPOSE_PROJECT_NAME) |
| `SECRET_KEY` | Django secret key |
| `VITE_SALEOR_API_URL` | Saleor GraphQL endpoint |
| `VITE_SALEOR_CHANNEL` | Sales channel slug |
| `SALEOR_WEBHOOK_SECRET` | Webhook signature verification |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key for checkout |

---

## Common Commands

```bash
# Start all services
docker compose --profile saleor up -d

# Start without Saleor (just Django + frontend)
docker compose up -d

# Django shell
docker compose exec web python manage.py shell

# Create superuser
docker compose exec web python manage.py createsuperuser

# Run migrations
docker compose exec web python manage.py migrate

# View Django logs
docker compose logs -f web

# View Saleor logs
docker compose logs -f saleor-api

# Reset Saleor admin password
docker compose exec saleor-api python manage.py shell -c "
from saleor.account.models import User
u = User.objects.filter(is_superuser=True).first()
u.set_password('newpassword')
u.save()
"

# Stop everything
docker compose --profile saleor down

# Nuclear reset (removes all data)
docker compose down -v
```

---

## Troubleshooting

### CSRF Token Error on Login

**Symptom:** "CSRF token not found" when logging in

**Cause:** Cookie name mismatch between Django and frontend

**Fix:** Ensure `VITE_PROJECT_NAME` matches `COMPOSE_PROJECT_NAME` in `.env`, then restart:

```bash
docker compose restart static
```

### Webhook Not Triggering Enrollment

1. Check webhook is created in Saleor Dashboard → Apps
2. Verify `SALEOR_WEBHOOK_SECRET` matches in both `.env` and webhook config
3. Check Django logs: `docker compose logs -f web`
4. Ensure target URL uses `host.docker.internal` not `localhost`

### Saleor Dashboard Login Failed

Reset the password:

```bash
docker compose exec saleor-api python manage.py shell -c "
from saleor.account.models import User
u = User.objects.filter(is_superuser=True).first()
u.set_password('admin')
u.save()
"
```
