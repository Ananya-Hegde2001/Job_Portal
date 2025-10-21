<div align="center">

# 🧑‍🏫 Teacher Job Portal

A modern portal that connects educators with institutions in a simple, friendly way.

— Find jobs. Save favorites. Create alerts. Apply and track progress. —

---

[What it does](#-what-it-does) · [Features](#-features) · [Pages](#-pages) · [For Teachers](#-for-teachers) · [For Employers](#-for-employers) · [How to run](#-how-to-run) · [Demo logins](#-demo-logins) · [Languages](#-languages) · [Payments](#-payments) · [Roadmap](#-roadmap)

</div>

## 🎯 What it does
Teacher Job Portal is a single place to discover academic opportunities and manage the hiring journey. Teachers can search and filter roles, save jobs, set alerts, and apply with a short cover note. Employers can post openings and review applications. Everyone gets a clean, responsive experience with helpful notifications.

## ✨ Features
- Secure sign in with roles: Teacher, Employer, Admin
- Powerful job search: keywords, subject, grade, city/region, remote/onsite, experience, employment type
- Job details at a glance: tags, salary/payscale (when available), requirements, benefits
- Save jobs (Teacher)
- Job Alerts (Teacher):
  - “Create alert from this search” on the Jobs page (login required)
  - Manage alerts on the Alerts page
- Apply with a short cover letter (Teacher)
- Application status updates (submitted, shortlisted, hired/rejected)
- Notifications Center:
  - Bell icon with unread badge
  - Dedicated page to view, filter (unread), and mark as read
- Profiles:
  - Teacher: subjects, grades, experience, skills, location, bio
  - Employer: basic organization profile
- Dashboards: quick access for Teacher and Employer
- Multilingual UI (multiple Indian languages supported)
- Light/Dark theme toggle and mobile‑friendly layouts
- Help Center & About pages on the public home
- AI Chat (protected): a helpful assistant page
- Payments (test): Razorpay checkout on pricing (Home)

## 🗺 Pages
- Home: quick search, featured sections, pricing with test checkout
- Jobs (/jobs): filters + “Create alert from this search”
- Job Detail (/jobs/:id): full description, tags, save/apply
- Alerts (/alerts): view/remove saved job alerts (Teacher)
- Notifications (/notifications): grouped by date, unread filter, mark as read
- Profile (/profile): manage teacher or employer profile
- Dashboards: teacher and employer quick access
- AI Chat (/ai-chat): protected assistant
- Institutions, Salary Guide, Help Center, About (public info pages)

## 👩‍🏫 For Teachers
- Search, filter, and browse relevant roles
- Save jobs you like
- Create job alerts from your current search
- Apply with a short cover letter
- Track updates in Notifications
- Build a basic profile (subjects, grades, skills, experience)

## 🏫 For Employers
- Post jobs with structured details (title, subject, grade, location, type)
- Review applications for your jobs
- Manage your organization profile

## ⚙️ How to run (Windows PowerShell)
Prerequisite: Node.js 18+

Backend (API)
```powershell
cd server
copy .env.example .env
npm install
npm run init:db
npm run seed:jobs
npm run dev   # runs at http://localhost:4000
```

Frontend (Web)
```powershell
cd ../client
npm install
npm run dev   # runs at http://localhost:5173
```

## 🔐 Demo logins
- Admin:    admin@portal.local / admin123
- Teachers: employee1@gmail.com / password123
            employee2@gmail.com / password123
            rithikashetty@gmail.com / Rithika123
- Employers: school1@gmail.com / password123
             school2@gmail.com / password123

## 🌍 Languages
English plus multiple Indian languages (e.g., Hindi, Kannada, Tamil, Telugu, Malayalam, Bengali, Gujarati, Marathi, Punjabi, Odia, Urdu). Language choice is remembered, and RTL is handled where applicable.

## 💳 Payments
Razorpay is integrated in test mode for the pricing section on Home. It creates an order on the server and verifies the payment signature.

## 🧭 Roadmap (high‑level)
- Enhanced employer analytics
- Resume uploads and richer teacher profiles
- Real‑time messaging between teachers and employers
- Postgres migration for larger deployments
- Notification preferences and email digests
- More public pages and guides

---

Need help getting it running or want a specific page/screenshots added here? Open an issue or ask in the repo. 👋


