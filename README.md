# Teacher Job Portal

Full-stack web application connecting schools/employers with teachers.

## Stack
- Frontend: React (Vite) + Context API / Hooks
- Backend: Node.js (Express) + SQLite (better-sqlite3)
- Auth: JWT (access + refresh optional groundwork)

## High-Level Features
- Roles: teacher, employer, admin
- Auth: register/login, password hash, role-based access
- Teacher: profile (skills, subjects, grades, resume), search/apply jobs, track applications
- Employer: company profile, post/manage jobs, review applicants, messaging placeholder
- Admin: approve jobs, manage users, basic analytics placeholder
- Jobs: search/filter (keywords, location, subject, grade level)
- Notifications: basic system (new application, job status changes)

## Monorepo Structure
```
Job_Portal/
  server/        # Express API
  client/        # React SPA
  README.md
```

## Quick Start (once scaffolded)
```powershell
# Backend
cd server
npm install
npm run dev

# Frontend
cd ../client
npm install
npm run dev
```

Open: http://localhost:5173 (frontend) which calls API at http://localhost:4000/api

## API Overview
Base URL: `http://localhost:4000/api`

Auth
- POST /auth/register { email, password, role: teacher|employer, name }
- POST /auth/login { email, password }
- GET /auth/me (JWT)

Jobs
- GET /jobs?q=&subject=&grade=&location= (public approved only)
- GET /jobs?status=pending (admin with token)
- GET /jobs/:id (approved only)
- POST /jobs (employer) create pending
- PUT /jobs/:id (employer owner or admin) update / approve / reject / close
- DELETE /jobs/:id (employer owner or admin)

Applications
- POST /applications (teacher) { job_id, cover_letter }
- GET /applications/mine (teacher)
- GET /applications/job/:jobId (employer owning job or admin)
- PUT /applications/:id/status (employer/admin) { status: submitted|shortlisted|rejected|hired }

Profiles
- GET /profiles/me (authed teacher/employer)
- POST/PUT /profiles/teacher
- POST/PUT /profiles/employer

Notifications
- GET /notifications (authed)
- POST /notifications/:id/read

## Frontend Pages
- Home: summary & quick links
- Jobs list / detail with apply
- Auth: Login / Signup
- Dashboards: Teacher (applications), Employer (jobs), Admin (pending jobs)
- Post Job form
- Profile management (teacher/employer specific)

## Development Notes
- SQLite file stored at `server/data/jobportal.db`
- Recreate schema: delete DB file then run `npm run init:db` in `server`
- Default admin user: email `admin@portal.local` password `admin123`

## Roadmap / Enhancements
- Password reset flow & email service
- Social login (Google / LinkedIn OAuth)
- Full-text search (fts5) indices
- Advanced filters (salary range, experience, location radius)
- Resume upload storage (S3 / Cloud)
- Messaging system (real-time via WebSocket)
- Notification events on status changes
- Analytics endpoints & dashboard charts
- Rate limiting & input validation library (zod)
- Unit/integration tests (Jest / supertest)
- Dockerfile and docker-compose for reproducible env
- CI pipeline (GitHub Actions)

## Scripts Recap
```powershell
cd server; npm run init:db  # initialize database & seed admin
cd server; npm run dev      # start API on port 4000
cd client; npm run dev      # start React dev server on 5173
```

## Environment Variables (`server/.env`)
```
PORT=4000
JWT_SECRET=change_me_dev
DB_FILE=./data/jobportal.db
```

## Planned Tables
- users
- teacher_profiles
- employer_profiles
- jobs
- applications
- notifications

## Next Steps
1. Implement DB schema + migrations
2. Build auth endpoints
3. Build job & application endpoints
4. Scaffold React pages & routing
5. Add profile management

---
Initial scaffold in progress.

## UI / Theming
Styling uses a single CSS file `client/src/styles.css` with CSS variables declared in `:root` for colors, spacing radii, and transitions. To customize theme:
1. Edit palette variables like `--primary`, `--bg`, `--panel`.
2. Adjust component spacing / radius via `--radius` tokens.
3. Add new utility classes near the bottom for consistency.

No external framework is required; you can layer in Tailwind or a component library later by gradually replacing class usage. Cards / grids / layout rely on modern CSS grid + flex and stay responsive under 760px.
