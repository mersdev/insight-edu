# Insight EDU PRD (Agent)

## Product Overview
Insight EDU is a web application for managing students, classes, attendance, behaviors, and performance across three roles (HQ Admin, Teacher, Parent). It also generates AI-powered insights to help educators and parents understand student trends.

## Goals
- Provide a single system to manage students, classes, sessions, and staff.
- Track attendance, behaviors, and scores over time.
- Enable role-based views for HQ Admin, Teachers, and Parents.
- Generate AI insights to summarize progress and risks.

## User Roles and Access
- HQ Admin (role: HQ)
  - Full access to dashboards and management pages.
- Teacher (role: TEACHER)
  - Access to classes, input, and reports for assigned teaching tasks.
- Parent (role: PARENT)
  - Access to reports and student insights for their child(ren).

## Core User Journeys
- HQ Admin logs in, views dashboard KPIs, manages teachers, students, classes, and locations.
- Teacher logs in, views assigned classes, records scores/attendance/behavior, and checks reports.
- Parent logs in, reviews reports and AI insights for their child.

## Functional Requirements
Authentication and Session
- Email/password login with JWT.
- Role-based routing and access control.
- Optional password change flow.
- Store token in localStorage and use Bearer auth headers.

HQ Admin
- View dashboard metrics and charts.
- Manage teachers (create/update/delete).
- Manage students (create/update/delete).
- Manage classes and locations.
- Manage sessions and attendance.
- Access reports across the organization.

Teacher
- View classes and sessions.
- Record attendance and session status.
- Record scores and behavior ratings.
- View reports for assigned classes.

Parent
- View reports and insights for their child(ren).
- Access student trends and risk indicators.

Shared
- Settings for dashboard insights and refresh intervals.
- AI insights generation for students.
- Sync endpoint for batch updates.

## Data Model (D1 Tables)
- settings
- users (role: HQ, TEACHER, PARENT)
- locations
- teachers
- classes
- students
- sessions
- attendance
- scores
- behaviors
- student_insights

## System Components
Frontend (React + TypeScript)
- SPA built with Vite and React Router (HashRouter).
- API client in `frontend/services/backendApi.ts`.
- AI integration in `frontend/services/aiService.ts` using OpenAI `gpt-4.1-mini`.

Backend (Cloudflare Workers)
- Worker entry: `backend/src/worker.js`.
- Routes under `/api` with JWT auth for protected endpoints.
- CORS enabled for all origins.
- D1 database binding: `DB`.

Database (Cloudflare D1)
- Schema in `backend/init.sql`.
- Seed data in `backend/seed.sql`.
- Reset local D1 (drop/recreate/seed): `cd backend && npm run db:reset`.

## API Overview (Worker Routes)
Base: `/api/v1`

Public:
- `POST /api/v1/auth/login`
- `GET /api/v1/health` (also `GET /health`)

Protected:
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/change-password`

Admin group:
- `GET|PUT /api/v1/admin/settings`
- `GET /api/v1/admin/users`
- `PUT|DELETE /api/v1/admin/users/:id`
- `GET|POST /api/v1/admin/locations`
- `GET|PUT|DELETE /api/v1/admin/locations/:id`
- `GET|POST /api/v1/admin/teachers`
- `GET|PUT|DELETE /api/v1/admin/teachers/:id`
- `GET|POST /api/v1/admin/classes`
- `GET|PUT|DELETE /api/v1/admin/classes/:id`
- `GET|POST /api/v1/admin/students`
- `PUT|DELETE /api/v1/admin/students/:id`
- `GET|POST /api/v1/admin/sessions`
- `GET|PUT|DELETE /api/v1/admin/sessions/:id`
- `PUT /api/v1/admin/sessions/:id/status`

Teacher group:
- `GET|POST /api/v1/teacher/sessions`
- `GET|PUT|DELETE /api/v1/teacher/sessions/:id`
- `PUT /api/v1/teacher/sessions/:id/status`
- `GET|POST /api/v1/teacher/attendance`
- `GET|POST /api/v1/teacher/scores`
- `GET|POST /api/v1/teacher/behaviors`
- `POST /api/v1/teacher/student-insights`
- `GET /api/v1/teacher/student-insights/:studentId`

## Non-Functional Requirements
- SPA should render well on desktop and mobile.
- API responses are JSON and must include CORS headers.
- JWT secret must be set in production.
- AI insights require a valid OpenAI API key.

## Local Development
Prereqs: Node.js and Wrangler.

Backend:
- `cd backend && npm run dev`
- URL: `http://localhost:8787`
- Health: `http://localhost:8787/health`
- API base: `http://localhost:8787/api`

Frontend:
- `cd frontend && npm run dev`
- URL: `http://localhost:5173`
- API base: `VITE_API_URL` or `http://localhost:8787/api`

## Environment Variables
Frontend:
- `VITE_API_URL` (API base URL; supports host-only or `/api` and resolves to `/api/v1`)
- `VITE_OPENAI_API_KEY` or `OPENAI_API_KEY` (injected by `frontend/vite.config.ts` into `process.env.OPENAI_API_KEY`)

Backend (Workers):
- `JWT_SECRET` (optional; defaults to `test-secret-key`)

## Testing
- Backend: `cd backend && npm test` (Jest)
- Frontend unit: `cd frontend && npm run test` (Vitest)
- E2E: `cd frontend && npm run test:e2e` or `./dev-tools/run-e2e-tests.sh`
- Cypress config: `frontend/cypress.config.ts` and `frontend/cypress.env.json`

## Deployment (Detailed)
Backend (Cloudflare Workers)
1. Configure Cloudflare access:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `JWT_SECRET`
2. Ensure `backend/wrangler.toml` references the D1 database.
3. Deploy:
   - `cd backend && npx wrangler deploy --env production`
4. Seed remote D1 if needed:
   - `cd backend && npm run db:seed:remote`

Frontend (Cloudflare Pages)
1. Build with envs:
   - `cd frontend && VITE_API_URL=... VITE_OPENAI_API_KEY=... npm run build`
2. Deploy:
   - `cd frontend && npx wrangler pages deploy dist --project-name=insight-edu-frontend --branch=main`

CI Deployment
- Backend workflow: `.github/workflows/deploy-backend.yml`
  - Runs tests, dry-run deploy, then deploys on `main`.
- Frontend workflow: `.github/workflows/deploy-frontend.yml`
  - Builds and deploys on `main`.

## Alignment Notes
- Source of truth for backend: `backend/src/worker.js` and `backend/wrangler.toml`.
- Source of truth for frontend: `frontend/index.tsx`, `frontend/App.tsx`, and `frontend/services/backendApi.ts`.

## Rules for AI Agent
- After fix, update the backend Jest test and frontend Cypress test and make sure e2e testing is sucessful
- If the backend schema changed, please run the db migration script automatically
- Layout Guard
  - The Settings page must always render the Behavior Indicators card at the top and the Manual Behavior Indicator card immediately below it; avoid reshuffling these cards in future changes.
  - Keep them wrapped in the `<section data-layout-guard="behavior-indicators">` block so the layout order is explicit and the default behavior tiles stay on top.
  - Ensure every seeded teacher has a matching `users` record so HQ reports always link teachers to login-enabled accounts and any new teacher creation follows the same pattern.
  - The default `DEFAULT_BEHAVIOR_CATEGORIES` badges should stay visible in the Settings manual indicator group, as they communicate the fallback categories details.
