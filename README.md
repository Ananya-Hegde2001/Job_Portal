<div align="center">

# 🧑‍🏫 Teacher Job Portal

Find the right teaching job. Help institutions hire faster.

— Clean, responsive, multi‑language job portal for Teachers, Employers, and Admins —

</div>

## What this project includes

All the core pieces you need to run a modern education job portal:

- Accounts and roles
  - Teacher, Employer, Admin logins (with sample dev accounts)
  - Secure session handling (JWT under the hood)

- Jobs and discovery
  - Browse all open roles with fast keyword search
  - Powerful filters: subject, grade level, city/region, organization type, employment type, mode (remote/on‑site), experience
  - Rich job details: salary/pay scale, requirements, responsibilities, benefits, deadlines

- Teacher experience
  - Save/Unsave jobs for later
  - Create Job Alerts from your current search (e.g., “Math in Bengaluru”) and manage them on the Alerts page
  - Apply with a short cover letter; see your past applications
  - Profile page: subjects, grades, skills, experience, location, bio, LinkedIn/resume link, avatar/resume upload support

- Employer experience
  - Post new jobs and manage applications for your roles
  - Employer profile: company info, logo, website, industry, location

- Notifications (in‑app)
  - See updates like “Application submitted” or status changes (shortlisted/rejected/hired)
  - Unread badge in the navbar, grouped by date, quick “mark read”

- Helpful extras
  - AI Chat Assistant (protected) to help with quick questions
  - Pricing section on Home with Razorpay (test mode) checkout flow
  - Institutions page, Salary Guide + Salary Detail pages
  - Help Center and About (shown for visitors on the homepage)
  - Floating Feedback button and toasts for quick messages
  - Mobile‑responsive design + Light/Dark theme toggle
  - Multi‑language UI (English + popular Indian languages)

## Quick start (Windows)

1) Start the API
```powershell
cd server
copy .env.example .env
npm install
npm run init:db
npm run seed:jobs
npm run dev   # API: http://localhost:4000
```

2) Start the frontend
```powershell
cd ../client
npm install
npm run dev   # Web: http://localhost:5173
```

3) Sign in with sample accounts
- Admin:    admin@portal.local / admin123
- Teachers: employee1@gmail.com / password123
            employee2@gmail.com / password123
            rithikashetty@gmail.com / Rithika123
- Employers: school1@gmail.com / password123
             school2@gmail.com / password123

Tip: The development database file is at `server/data/jobportal.db`.

## Main pages and where to find them

- Home: search bar, featured sections, pricing (test checkout)
- Jobs (/jobs): filters, results, “Create alert from this search” (teachers log in to create)
- Job Detail (/jobs/:id): full description, tags, Save/Apply
- Job Alerts (/alerts): list and delete saved search alerts (teacher)
- Notifications (/notifications): updates about your activity (grouped by Today/Yesterday/This Week)
- Profile (/profile): teacher or employer profile
- Teacher Dashboard (/dashboard/teacher) and Employer Dashboard (/dashboard/employer)
- AI Chat (/ai-chat): assistant (only for signed‑in users)

## Languages available (i18n)

English (en), Hindi (hi), Kannada (kn), Tamil (ta), Telugu (te), Malayalam (ml), Bengali (bn), Gujarati (gu), Marathi (mr), Punjabi (pa), Odia (or), Urdu (ur)

The app remembers your choice and switches layout direction when needed (e.g., Urdu).

## Payments (test mode)

- A demo checkout is available in the pricing section on the Home page
- Uses Razorpay test keys on the server; the server validates payment signatures
- This is for demonstration only (no real charges)

## Notes for running locally

- If the frontend can’t reach the API, it will try to auto‑discover it on http://localhost:4000/api via a health check
- You can set a specific API base with `client/.env`: `VITE_API_URL=http://localhost:4000/api`
- Use the provided seed accounts to explore all flows

## Project layout (at a glance)

```
client/  → React app (components, pages, state, util, locales)
server/  → Express API (routes for auth, jobs, applications, profiles, saved, alerts, notifications, ai, payments)
docs/    → Documentation (report/notes)
```

— That’s it! You now have a complete teacher job portal with search, alerts, notifications, profiles, applications, and a clean responsive UI. If you’d like a live deployment guide (Vercel + Render) or screenshots in this README, I can add those next.


