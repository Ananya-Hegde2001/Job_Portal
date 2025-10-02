<div align="center">

# 🧑‍🏫 Teacher Job Portal

Full‑stack recruitment & talent management platform connecting educators with institutions.

**Status:** Active Development • **Frontend:** React (Vite) • **Backend:** Node.js (Express) • **DB:** SQLite → PostgreSQL (planned)

---

[Features](#-features) · [Architecture](#-architecture-overview) · [Getting Started](#-getting-started) · [API](#-api-overview) · [Database](#-database-schema) · [Roadmap](#-roadmap) · [Contributing](#-contributing)

</div>

## ✨ Project Overview
The Teacher Job Portal centralizes educator hiring. Institutions can publish structured job vacancies while teachers maintain rich professional profiles and track application lifecycles. The system emphasizes transparency, performance, multilingual readiness (Indian languages), and an extensible architecture ready for future AI‑assisted matching and workflow automation.

## ✅ Key Features
- Role-based access: Teacher • Employer • Admin
- Secure authentication (JWT) & profile management
- Job posting lifecycle (draft → pending → approved → closed)
- Advanced job search & filtering (subject, grade, location, keywords)
- Application submission & status tracking
- Saved jobs (planned) & notification system
- Admin moderation (users + postings)
- Internationalization framework (multi-language content groundwork)
- Clean modular backend + React SPA frontend
- Extensible for analytics, AI suggestions, and real-time messaging

## 🗂 Monorepo Structure
```
Job_Portal/
  client/           # React (Vite) SPA
    src/
      components/   # Reusable UI + domain components
      pages/         # Route-level pages
      state/         # Context / providers
      util/          # Helpers (api, toast, email)
      locales/       # i18n JSON translations
  server/           # Express API
    src/
      routes/       # auth, jobs, applications, profiles, admin, ai...
      db/           # init, migrate, connection
      scripts/      # maintenance + seeding tools
    data/           # SQLite database file(s)
  docs/             # Synopsis & supporting docs
  README.md
  package.json      # Root convenience (optional tooling)
```

## 🧱 Architecture Overview
```
┌──────────┐     HTTP/JSON     ┌─────────────┐        ┌──────────────┐
│  Client  │ ─────────────────▶│  Express API│────────▶│   Database    │
│ React    │◀───────────────── │  (services) │        │ (SQLite→PG)  │
└────┬─────┘      Web Assets   └──────┬──────┘        └─────┬────────┘
     │                                │  Notifications        │
     │                                ▼                       │
     │                         ┌────────────┐                │
     │                         │ Future MQ  │ (Rabbit/SQS)    │
     │                                │                      │
     ▼                                ▼                      ▼
 Frontend i18n                Email/SMS Adapter       Object Storage (CVs)
```

### Design Principles
- Separation of concerns (routes → services → data access)
- Predictable state & DTO shapes
- Migration path to message queues & Postgres
- Developer ergonomics (minimal boilerplate, readable scripts)

## 🛠 Tech Stack
| Layer        | Technology                              |
|--------------|------------------------------------------|
| Frontend     | React (Vite), Context API, CSS modules   |
| Backend      | Node.js, Express, modular routers        |
| Database     | SQLite (dev) → PostgreSQL (scale)        |
| Auth         | JWT (access + refresh groundwork)        |
| i18n         | JSON locale bundles + simple loader      |
| Styling      | `styles.css` + CSS variables             |
| Testing (plan)| Jest, Supertest, Cypress                |
| Deployment (plan)| Docker, GitHub Actions CI            |

## 🚀 Getting Started
### Prerequisites
- Node.js ≥ 18
- npm (or pnpm/yarn if adapted)

### 1. Clone
```powershell
git clone <repo-url>
cd Job_Portal
```

### 2. Backend Setup
```powershell
cd server
npm install
npm run init:db   # creates / migrates SQLite & seeds admin
npm run dev       # starts API on http://localhost:4000
```

### 3. Frontend Setup
```powershell
cd ../client
npm install
npm run dev       # starts Vite dev server on http://localhost:5173
```

### 4. Login (Seed Data)
- Admin: `admin@portal.local` / `admin123`

### 5. Environment Variables (`server/.env`)
```env
PORT=4000
JWT_SECRET=change_me_dev
DB_FILE=./data/jobportal.db
# Future additions:
# EMAIL_SMTP_HOST=
# EMAIL_SMTP_USER=
# EMAIL_SMTP_PASS=
```

## 📡 API Overview
Base URL: `http://localhost:4000/api`

| Domain | Endpoint (subset) | Method | Notes |
|--------|-------------------|--------|-------|
| Auth   | /auth/register    | POST   | Register user (teacher/employer) |
|        | /auth/login       | POST   | Issue JWT |
|        | /auth/me          | GET    | Current user profile |
| Jobs   | /jobs             | GET    | Public approved jobs (query filters) |
|        | /jobs/:id         | GET    | Job details (approved) |
|        | /jobs             | POST   | Employer creates (pending) |
|        | /jobs/:id         | PUT    | Update / approve / close |
| Apps   | /applications     | POST   | Teacher applies |
|        | /applications/mine| GET    | Teacher’s applications |
|        | /applications/job/:jobId | GET | Employer/admin view |
|        | /applications/:id/status | PUT | Status transition |
| Profiles | /profiles/me    | GET    | Own profile |
|        | /profiles/teacher | POST   | Upsert teacher profile |
|        | /profiles/employer| POST   | Upsert employer profile |
| Notifications | /notifications | GET | User notifications |

> For full payload shapes see route definitions in `server/src/routes/*`.

## 🗄 Database Schema (Core Entities)
```
users(id, email, password_hash, role, created_at)
teacher_profiles(user_id FK, subjects, experience_years, location, qualifications, bio)
employer_profiles(user_id FK, org_name, address, contact_person)
jobs(id, employer_id FK, title, description, subject_tags, grade_levels, location,
     status, salary_min, salary_max, created_at, updated_at)
applications(id, job_id FK, teacher_id FK, status, cover_letter, resume_path,
             created_at, updated_at)
notifications(id, user_id FK, type, payload_json, is_read, created_at)
```

### Status Lifecycle (Applications)
`submitted → shortlisted → interview_scheduled (future) → offered → hired | rejected`

## 🌐 Internationalization
Locale JSON files reside in `client/src/locales/<lang>/translation.json`.
- Add new language: copy `en` folder, translate values, update i18n loader (`i18n.js`).
- Prefer short semantic keys over full sentence duplication.

## 🔔 Notifications
Currently stored + retrievable via `/notifications` endpoint. Future enhancements:
- Real-time delivery via WebSockets / SSE
- Email templating
- Digest batching & user preferences

## 🎨 Theming
Centralized CSS variables in `client/src/styles.css`:
```css
:root { --primary:#2563eb; --bg:#0f1115; --panel:#1b1f27; --radius-sm:4px; }
```
Override variables for light mode or alternate palettes. Component classes consume tokens (avoid hard-coded colors).

## 🧪 Testing (Planned Structure)
| Layer | Tool | Target |
|-------|------|--------|
| Unit  | Jest | Service & util functions |
| API   | Supertest | Auth, jobs, applications |
| E2E   | Cypress | Core user journeys |
| Perf  | k6/JMeter | Job search & apply flows |
| Sec   | Dependency audit | Known CVEs |

## 🧰 Useful Scripts
```powershell
cd server; npm run init:db   # Initialize / migrate database & seed admin
cd server; npm run dev       # Run API (watch mode)
cd client; npm run dev       # Run frontend
```

## 🛡 Security & Hardening (Roadmap)
- Password hashing (bcrypt) ✓
- Input validation (introduce zod / joi) ⏳
- Rate limiting & IP throttling ⏳
- Audit logging expansion ⏳
- JWT refresh rotation & revocation list ⏳
- Content Security Policy (CSP) headers ⏳

## 🗺 Roadmap
**Near Term**: Password reset, profile enhancements, saved jobs UI, notification read UX.

**Mid Term**: Advanced search filters (salary band, experience), resume uploads (S3), analytics dashboards, basic messaging.

**Long Term**: AI-assisted job matching, scheduling integration, multi-tenant org groups, recommendation engine, real-time interviews integration.

## 🤝 Contributing
1. Fork & branch: `feat/<short-feature-name>`
2. Keep commits atomic & conventional (e.g., `feat: add job filter by salary`)
3. Ensure lint & (when implemented) tests pass
4. Open PR with concise description + screenshots for UI changes

### Architectural Guidelines
- Keep route logic thin: delegate to service modules
- Avoid implicit magic in middleware (be explicit about auth scopes)
- Prefer composition over inheritance in React components

## 📦 Deployment (Planned)
| Stage | Approach |
|-------|----------|
| Build | CI (GitHub Actions) builds client + server |
| Bundle | Docker multi-stage image |
| Release | Container registry + orchestrator (Kubernetes / App Service) |
| Migrate | Run migration script on startup (idempotent) |

## 📝 License
License **TBD**. If you intend to open source, consider MIT/Apache-2.0; add a `LICENSE` file accordingly.

## 🙌 Acknowledgements
- Open-source community (React, Express ecosystem)
- Future contributors for localization & accessibility improvements

## 📣 Feedback / Support
Open an issue or propose a discussion thread. For security concerns, disclose responsibly (avoid public POC until patched).

---

> This README is designed to scale with the project. Update sections as features graduate from roadmap to implementation.

