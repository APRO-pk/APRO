# APRO — Aero Propulsion Rocketry Operations

**Live Site:** Pakistan Aerospace rocketry organization website  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS (CDN) + Supabase  
**Hosting:** Netlify (SPA with `_redirects` for client-side routing)  
**Domain/Title:** `APRO - Aero Propulsion Rocketry Operations`

---

## What Is APRO?

APRO (Aero Propulsion Rocketry Operations, previously referred to as APRA — All Pakistan Rocketry Association) is a **national aerospace community** based in Pakistan. It connects students, builders, and campus leads through a single operating layer for rocketry — covering **membership, chapters, safety governance, and technical momentum**.

The organization traces back to a university technical branch called **RPS (Rocket Propulsion Systems)** and is legally registered as **APRO Dynamics (Pvt) Ltd**.

---

## Site Architecture

### Framework & Tooling

| Layer | Technology |
|---|---|
| UI Library | React 19 |
| Language | TypeScript 5.8 |
| Bundler | Vite 6 (dev server on port 3000) |
| Styling | Tailwind CSS via CDN (`cdn.tailwindcss.com`) |
| Fonts | Montserrat (headings), Open Sans (body) via Google Fonts |
| Icons | lucide-react, react-icons (FaWhatsapp) |
| Routing | react-router-dom v7 (HashRouter) |
| Backend | Supabase (Postgres, Auth, Storage) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage (`docs`, `resumes` buckets) |
| Deployment | Netlify |

### Route Map (HashRouter)

| Path | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/about` | About APRO | Public |
| `/events` | Events / Workshops | Public |
| `/resources` | Member Resource Portal (login-gated) | Public |
| `/contact` | Contact | Public |
| `/membership` | Membership overview | Public |
| `/legal` | Legal / Safety Code | Public |
| `/student` | Student/Individual Application | Public |
| `/chapter` | Chapter/Squadron Application | Public |
| `/join` | Join APRO (Career Application) | Public |
| `/admin` | Admin Login | Public |
| `/login` | Member Login | Public |
| `/admin/dashboard` | Admin Dashboard | Protected (admin only) |
| `/admin/students` | Student Applications Review | Protected (admin only) |
| `/admin/chapters` | Chapter Applications Review | Protected (admin only) |
| `/admin/careers` | Career Applications Review | Protected (admin only) |

---

## Pages & Capabilities

### 1. Home (`/`)
- Hero section with rocket background image (`bg-home.avif`)
- Three primary call-to-action cards:
  - **Student / Individual Access** → `/student`
  - **Join APRO** (careers/contributor) → `/join`
  - **Start a Squadron** (chapter) → `/chapter`
- Safety Layer section linking to the **APRO National Safety Code (NSOC)** PDF (hosted in Supabase Storage)
- Chapter expansion callout

### 2. About (`/about`)
- Organization origin story (roots in RPS — Rocket Propulsion Systems)
- Three core pillars:
  1. **Static fire and propulsion analysis** — ground testing, thrust curves, stability data
  2. **Iterative design cycles** — design, test, fail safely, learn
  3. **Regulatory and safety standards** — governance and responsibility framework

### 3. Events (`/events`)
- **Active Training** workshops (registration via Google Forms):
  - Rocket Design Workshop (full-stack rocketry)
  - Avionics Bay Integration (altimeters, wiring, recovery triggers)
  - Recovery Systems 101 (parachutes, shock cords)
- **Coming Soon**:
  - TVC Design Lab (thrust vector control, gimbal systems)
  - Inaugural launch event
- **Roadmap**: National certification trials for amateur rocketeers in Pakistan

### 4. Contact (`/contact`)
- Email: `contact.apro.pk@gmail.com`
- Instagram: `@apro.pk`
- Contact form (simulation — alerts on submit, no backend handler yet)

### 5. Membership (`/membership`)
- Describes three membership benefits:
  - Community access (network of students, builders, mentors)
  - Resource library (technical material, guides, safety doctrine)
  - Exclusive events (workshops, launches)
- Two tracks:
  - **Student / Individual** → apply at `/student`
  - **Chapter / Squadron** → apply at `/chapter`

### 6. Legal (`/legal`)
- National Safety Code (NSOC) — mandatory safety doctrine for all APRO activity
- Three highlighted rules:
  - No targeting people, property, or living creatures
  - Electrical remote ignition only for launches
  - No metallic airframe bodies for standard participation

### 7. Resources (`/resources`)
- Login-gated member resource portal
- Requires **APRO ID + Password**
- Not-yet-authenticated users redirected to `/membership`

### 8. Student Application (`/student`)
Multi-step application form with fields:
- Personal info: full name, DOB, CNIC, phone, email
- Academic/professional: institution, major/title, certification level (None/Level 1/2/3), emergency contact
- Account setup: password + confirm
- Compliance declaration: explosives history, anti-weaponization acknowledgment
- Legal agreement (assumption of risk, NSOC compliance, indemnification) with electronic signature checkbox
- The Pledge ("Space Citizen of Pakistan") with checkbox
- **Backend**: On submit — creates Supabase Auth account, inserts row into `members` table, inserts row into `applications` table, inserts into `student_details` table, then signs user out (pending admin approval)

### 9. Chapter Application (`/chapter`)
Application form for campus squadrons:
- Unit info: proposed unit name, institution, faculty advisor details, lead name, estimated member count
- Compliance declaration: explosives history, anti-weaponization, campus approval (Yes/No/Pending)
- Legal agreement (assumption of risk, NSOC compliance, indemnification, intellectual property)
- The Pledge
- **Backend**: Inserts into `applications`, `chapter_details`, and `compliance_answers` tables

### 10. Join APRO — Career Application (`/join`)
For internships, part-time, full-time, or freelance/contract roles:
- Personal info, role type selector, resume upload (PDF/DOC — stored in Supabase Storage `resumes` bucket)
- "Why join" textarea
- **Backend**: Uploads resume file to Supabase Storage, inserts into `career_applications` table

### 11. Admin Login (`/admin`)
- Email/password login via Supabase Auth
- Validates user exists in `admins` table
- On success → redirects to `/admin/dashboard`

### 12. Member Login (`/login`)
- Email/password login via Supabase Auth
- Validates user exists in `members` table with `account_status === "APPROVED"`
- Blocks PENDING and REJECTED accounts

### 13. Admin Dashboard (`/admin/dashboard`)
Protected route (uses `ProtectedAdminRoute` component checking `admins` table).
- Displays counts for Student, Chapter, and Career applications (total & pending)
- Quick action links to each review page
- Overview panel with aggregate stats
- Logout button

### 14-16. Admin Review Pages
Three protected pages with identical patterns:
- **Student Applications** (`/admin/students`) — filterable by ALL/PENDING/APPROVED/REJECTED; modal detail view; approve/reject/mark-pending actions; updates both `applications.status` and `members.account_status`
- **Chapter Applications** (`/admin/chapters`) — same filter/action pattern; shows unit/institution/advisor/lead/compliance details
- **Career Applications** (`/admin/careers`) — same filter/action pattern; includes resume viewing via signed URL from Supabase Storage

---

## Backend (Supabase)

### Auth
- Supabase Auth with email/password
- Student applications auto-create auth accounts
- Admin login requires membership in `admins` table

### Database Tables (inferred from code)

| Table | Purpose |
|---|---|
| `members` | Core member records linked to `auth_user_id`; has `account_status` (PENDING/APPROVED/REJECTED) and `member_type` (STUDENT) |
| `applications` | Base application records with `applicant_type` (STUDENT/CHAPTER), `status`, and `member_id` |
| `student_details` | Extended student application data linked to `application_id` |
| `chapter_details` | Extended chapter application data (unit name, institution, advisor, lead, member count) |
| `compliance_answers` | Compliance declarations linked to chapter `application_id` |
| `career_applications` | Career/contributor applications (separate from `applications` table) |
| `admins` | Admin users linked to `auth_id` |

### Storage Buckets

| Bucket | Usage |
|---|---|
| `docs` | Stores the APRO National Safety Code (NSOC) PDF |
| `resumes` | Stores uploaded CVs/resumes from career applications |

### Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous API key
- `GEMINI_API_KEY` (via `process.env`) — Defined in Vite config, available at build time

---

## Project Structure

```
APRO/
├── index.html            # Entry HTML (Tailwind CDN, fonts, importmap)
├── index.tsx             # React DOM mount point
├── App.tsx               # HashRouter with all routes
├── types.ts              # NAV_ITEMS array + NavItem interface
├── vite.config.ts        # Vite config (port 3000, React plugin, path alias)
├── tsconfig.json         # TypeScript config (ES2022, JSX react-jsx)
├── netlify.toml          # Netlify build config
├── package.json          # Dependencies & scripts
├── metadata.json         # Site metadata (name, description)
├── assets/
│   ├── logo.png          # APRO logo
│   ├── bg.jpg            # Background image
│   ├── bg.avif           # Background image (AVIF)
│   ├── bg-home.avif      # Home page hero background
│   └── APRO National Safety Code (NSOC) v1.pdf  # Local copy of NSOC
├── public/
│   ├── icon.png          # Favicon
│   └── _redirects        # Netlify SPA redirect rule
├── src/
│   └── lib/
│       └── supabase.ts   # Supabase client initialization
├── components/
│   ├── Layout.tsx         # Header/nav/footer layout shell
│   ├── PageScaffold.tsx   # Reusable UI components (PageHero, SectionBand, SurfacePanel, FormShell, AuthShell, AdminShell, etc.)
│   └── ProtectedAdminRoute.tsx  # Admin auth guard
└── pages/
    ├── Home.tsx
    ├── About.tsx
    ├── Events.tsx
    ├── Contact.tsx
    ├── Resources.tsx
    ├── Membership.tsx
    ├── Legal.tsx
    ├── StudentApplication.tsx
    ├── ChapterApplication.tsx
    ├── JoinApplication.tsx
    ├── adminLogin.tsx
    ├── userLogin.tsx
    ├── AdminDashboard.tsx
    ├── StudentApplicationsPage.tsx
    ├── ChapterApplicationsPage.tsx
    └── CareerApplicationsPage.tsx
```

---

## Design System

### Colors
- **Dark Purple / Persian Indigo:** `#240046` (Primary dark)
- **Vivid Purple / Accent:** `#7B2CBF` (Accent purple)
- **Light Lavender:** `#F8F5FC` (Light tint)
- **Alert/Error:** `#DC2626`

### Typography
- **Headings:** Montserrat (700, 800 weight)
- **Body:** Open Sans (400, 600 weight)

### Key UI Patterns
- Dark theme with deep space-like backgrounds (`#05070d`, `#060912`)
- Rounded pill-style navigation and buttons (30px–40px border-radius)
- Glassmorphism panels with subtle borders (`border-white/10`) and inner shadows
- Gradient accent buttons (`linear-gradient(180deg, #9879ff, #7b2cbf)`)
- Dot-grid and line overlays for texture
- Subtle hover animations (translate-y, opacity, glow)

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

---

## Deployment

- Hosted on **Netlify**
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect rule in `public/_redirects`: `/* /index.html 200`
