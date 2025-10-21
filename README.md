<div align="center">

# 🧑‍🏫 Teacher Job Portal

Full‑stack platform connecting educators with institutions.

Frontend: React (Vite) · Backend: Node.js (Express) · DB: SQLite (dev) · i18n · Razorpay (test)

---

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [Env](#-environment-variables) · [Pages](#-key-pages) · [API](#-api-overview) · [i18n](#-internationalization) · [Deploy](#-deployment-notes)

</div>

## ✨ Overview
Employers post structured jobs; teachers build profiles, search/filter roles, save jobs, create job alerts, apply with cover letters, and track application status. The app includes notifications, multilingual UI, and a responsive design.

## ✅ Features
- Auth & Roles: Teacher • Employer • Admin (JWT)
- Advanced Job Search (subject, grade, location, employment type, mode, experience)
- Job Detail with Save/Unsave and Apply (cover letter)
- Saved Jobs (teacher)
- Job Alerts: create from current search; manage under /alerts (teacher)
- Notifications Center: unread badge, grouped by date, mark as read
- Profiles: Teacher & Employer profile management
- Payments (test): Razorpay order + verification wired to pricing on Home
- AI Chat Assistant (protected): streaming responses under /ai-chat
- Mobile‑responsive UI and theme toggle

## 🗂 Structure
```
Job_Portal/
  client/
    src/
      components/  pages/  state/  util/  locales/
  server/
    src/
      routes/ db/ scripts/
    data/
  README.md
  docs/
```

## 🧱 Architecture
```
React (Vite)  ⇄  Express API  ⇄  SQLite (better‑sqlite3)
                     ├─ Razorpay (test)
                     └─ AI Chat endpoints
```

## 🚀 Quick Start (Windows PowerShell)
Prerequisites: Node.js ≥ 18

1) Backend
```powershell
cd server
copy .env.example .env  # edit .env if needed
npm install
npm run init:db
npm run seed:jobs
npm run dev   # http://localhost:4000
```

2) Frontend
```powershell
cd ../client
npm install
npm run dev    # http://localhost:5173
```

3) Dev accounts
- Admin:    admin@portal.local / admin123
- Teachers: employee1@gmail.com / password123
            employee2@gmail.com / password123
            rithikashetty@gmail.com / Rithika123
- Employers: school1@gmail.com / password123
             school2@gmail.com / password123

SQLite file location (dev): `server/data/jobportal.db`

## 🔧 Environment Variables

server/.env
```env
PORT=4000
JWT_SECRET=change_me_dev
DB_FILE=./data/jobportal.db

# AI (optional)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

# Razorpay (test)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

client/.env (optional)
```env
# If not set, the client auto-discovers http://localhost:4000/api via /health
VITE_API_URL=http://localhost:4000/api
```

## 🧭 Key Pages
- Home: search, featured sections, pricing (Razorpay test checkout)
- Jobs (/jobs): filters + “Create alert from this search” (login required)
- Job Detail (/jobs/:id): details, tags, save, apply with cover letter
- Job Alerts (/alerts): list/delete subscriptions (teacher)
- Notifications (/notifications): unread filter, grouped by date, mark read
- Dashboards: Teacher & Employer quick links
- Profile (/profile): teacher/employer profiles
- AI Chat (/ai-chat): protected assistant

## 📡 API Overview (highlights)
Base: `http://localhost:4000/api`

Auth
- POST /auth/register · POST /auth/login · GET /auth/me · PUT /auth/me

Jobs
- GET /jobs (filters: q, subject, grade, city/location, employment_type, mode, min_experience, active)
- GET /jobs/:id · POST /jobs · PUT /jobs/:id (role‑guarded)

Applications
- POST /applications (teacher) · GET /applications/mine (teacher)
- GET /applications/job/:jobId (employer/admin)
- PUT /applications/:id/status (employer/admin)

Profiles
- GET /profiles/me
- POST/PUT /profiles/teacher (teacher)
- POST/PUT /profiles/employer (employer)

Saved & Alerts
- GET /saved/jobs · POST /saved/jobs/:jobId
- GET /saved/alerts · POST /saved/alerts · DELETE /saved/alerts/:id

Notifications
- GET /notifications · POST /notifications/:id/read

AI
- POST /ai/chat · POST /ai/chat/stream

Payments
- POST /payments/order · POST /payments/verify

Feedback
- POST /feedback

> See `server/src/routes/*.js` for full payloads and role guards.

## 🗄 Database (core)
```
users(id, email, password_hash, role, name, phone, reset_token, reset_expires, created_at)
teacher_profiles(user_id, subjects, grades, experience_years, skills, gender, work_status,
                 linkedin_url, location, bio, top_skills_json, certificates_json,
                 experience_json, education_json, resume_mime, resume_data, avatar_mime, avatar_data)
employer_profiles(user_id, company_name, logo_url, industry, description, website, location)
jobs(id, employer_id, title, description, subject, grade_level, city, organization_type,
     employment_type, pay_scale, salary_min, salary_max, min_experience, status,
     remote_allowed, application_deadline, benefits, responsibilities, requirements,
     education_required, created_at, updated_at)
applications(id, job_id, teacher_id, status, cover_letter, created_at, updated_at)
application_events(id, application_id, type, detail, created_at)
saved_jobs(user_id, job_id, created_at)
job_alert_subscriptions(id, user_id, subject, location, created_at)
notifications(id, user_id, type, message, is_read, created_at)
```

## 🌐 Internationalization
Languages bundled: en, hi, kn, ta, te, ml, bn, gu, mr, pa, or, ur
- Translation files: `client/src/locales/<lang>/translation.json`
- Loader: `client/src/i18n.js` (sets dir/lang and persists)

## 💳 Payments (test)
- Server routes: `/payments/order` and `/payments/verify` (HMAC signature check)
- Client invokes checkout with server key+order; use Razorpay test keys only

## 📱 UX
- Responsive layout; filters collapse on small screens
- Accessible controls on key flows; light/dark toggle in navbar

## 🚢 Deployment Notes
- Frontend: Vercel (static). Set `VITE_API_URL` to your API base.
- Backend: Render/Railway/Fly. Use persistent disk for SQLite (e.g., `/var/data/jobportal.db`) and set `DB_FILE`.
- CORS: Adjust allowed origins for production.


