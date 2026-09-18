# Appointment Booking System

A minimal two-portal (Admin / Patient) appointment booking system built as a developer knowledge test.

## Project Overview

Admins manage doctors and their weekly availability. Patients register, browse doctors, view real-time
available time slots, book an appointment, and cancel it later. The backend guarantees — at the
database level — that two patients can never book the same doctor/date/time slot, and that a cancelled
slot becomes bookable again.

## Technology Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios
**Backend:** Node.js, TypeScript, Fastify, Zod, Prisma ORM
**Database:** PostgreSQL
**Auth:** JWT + bcrypt password hashing
**Testing:** Vitest

## Features

- Single login shared by both portals; JWT carries the user's role (`ADMIN` / `PATIENT`)
- Admin: create/view/edit/delete doctors, set one availability window per day, view availability
- Patient: register, browse doctors, view generated 30-minute slots for a chosen date, book, view own
  appointments, cancel
- Race-safe booking: an atomic `INSERT ... ON CONFLICT ... DO UPDATE ... WHERE` guarantees no
  double-booking and reopens cancelled slots (see `backend/src/services/appointment.service.ts`)
- Centralized Zod validation, centralized error handler, centralized Axios client on the frontend

## Project Structure

```
backend/
  prisma/schema.prisma        # User, Doctor, DoctorAvailability, Appointment
  prisma/seed.ts              # seeds an admin user + 2 demo doctors with Mon-Fri availability
  src/
    config/    prisma client + env loader
    routes/    Fastify route registration (thin)
    controllers/  parse request -> call service -> send response
    services/  business logic (slot generation, booking rules, auth)
    validators/  Zod schemas
    middleware/  JWT auth, role guard, centralized error handler
    utils/     slot generation, JWT sign/verify, typed AppError classes
    tests/     Vitest unit + integration tests
frontend/
  src/
    pages/{admin,patient}   route-level screens
    layouts/                Admin/Patient shells with nav + logout
    services/               api.ts (Axios instance) + one file per resource
    hooks/useAuth.tsx        auth context (token/user in localStorage)
    components/              ProtectedRoute, Alert
docker-compose.yml           optional: PostgreSQL only
```

## Prerequisites

- Node.js 18+
- A running PostgreSQL instance (either your own local install, or `docker compose up -d` if you have
  Docker — the compose file only starts Postgres, nothing else)

## Environment Variables

Copy the example files and fill in real values:

```
backend/.env.example  -> backend/.env
frontend/.env.example -> frontend/.env
```

**backend/.env**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appointment_booking?schema=public"
JWT_SECRET="change-this-to-a-long-random-secret"
PORT=4000
ADMIN_EMAIL="admin@clinic.com"
ADMIN_PASSWORD="Admin@1234"
```

**frontend/.env**
```
VITE_API_URL=http://localhost:4000/api/v1
```

If you already have PostgreSQL running locally (as on this machine), just update the username/password/
port in `DATABASE_URL` to match your instance instead of using the docker-compose default.

## Database Setup

```bash
cd backend
npm install
npx prisma migrate dev --name init   # creates the schema
npm run prisma:seed                  # seeds an admin user + 2 demo doctors
```

The seeded admin login is printed to the console (defaults to `admin@clinic.com` / `Admin@1234`).

## Running Backend

```bash
cd backend
npm install
npm run dev        # http://localhost:4000
```

## Running Frontend

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Log in at `/login` with the seeded admin credentials to reach the Admin Portal, or register a new
account at `/register` to use the Patient Portal.

## Running Tests

```bash
cd backend
npm test
```

- `src/tests/slots.test.ts` — pure unit tests for slot generation/filtering (no DB required, always runnable)
- `src/tests/appointment.integration.test.ts` — end-to-end booking/conflict/cancellation flow against a
  real database; requires `DATABASE_URL` to point at a reachable, migrated database

## API Overview

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login

GET    /api/v1/doctors                     (public)
POST   /api/v1/doctors                     (admin)
GET    /api/v1/doctors/:id                 (public)
PUT    /api/v1/doctors/:id                 (admin)
DELETE /api/v1/doctors/:id                 (admin)

GET    /api/v1/doctors/:id/availability    (public)
POST   /api/v1/doctors/:id/availability    (admin) — upsert, one window per day

GET    /api/v1/doctors/:id/slots?date=YYYY-MM-DD   (public) — computed, never trusts the client

POST   /api/v1/appointments                (patient)
GET    /api/v1/appointments                (patient, own only)
PATCH  /api/v1/appointments/:id/cancel     (patient, own only)

GET    /api/v1/health
```

All error responses are `{ "error": "message" }` with an appropriate status code (400/401/403/404/409/500).

## Assumptions

- **Appointment duration: 30 minutes** (not specified in the requirements).
- One combined login endpoint for both portals; the admin account is seeded rather than self-registered,
  since no admin-registration flow was specified.
- Doctor list/availability/slots endpoints are public reads (no sensitive data); only writes and the
  patient's own appointment data require authentication.
- A slot is modeled as a single row per (doctor, date, time) that flips between `BOOKED` and `CANCELLED`,
  rather than an unbounded history of rows, so a plain unique index can enforce "no double booking" while
  still allowing a cancelled slot to be rebooked.

## Known Limitations

- No forgot-password / email verification flow.
- No pagination on doctor/appointment lists (fine at assessment scale).
- Doctor availability is a single window per day; multiple windows per day (e.g. morning + afternoon) are
  out of scope, matching the stated requirement.
- The integration test suite needs a real database connection and was validated against the schema/logic
  but not run inside this sandbox (no DB credentials available here); the pure slot-logic unit tests were
  run and pass.

## What I Would Improve With More Time

- Add admin-side view of all appointments (not just per-doctor).
- Add pagination/search on the doctor list.
- Add refresh tokens / shorter-lived access tokens.
- Add e2e tests (Playwright) covering the booking UI flow end-to-end.
- Support multiple availability windows per day per doctor.
