# TSSB — Full-Stack Server Administration & Infrastructure Management Platform

A production-ready, full-stack cyber-infrastructure control platform engineered with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **Neon PostgreSQL**. Designed specifically for server installation, cluster configuration, network VLAN routing, system daemon oversight, operational runbooks, and transactional audit trails.

---

## Architecture & Visual Baseline

TSSB delivers an enterprise dark cyber-ops atmosphere with an obsidian background, electric cyan accent tokens, and dynamic telemetry visualizations.

- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide React (Zero Emoji)
- **Visualizations**: Interactive SVG Infrastructure Pipeline (`User` -> `Vercel` -> `Next.js` -> `Prisma` -> `Neon PostgreSQL`) and Multi-VLAN Network Topology Mesh
- **Backend**: Next.js Server Actions & Route Handlers with server-side Zod validation
- **Database**: Neon PostgreSQL via Prisma ORM (with serverless connection pooling and transactional audit logging)
- **Authentication**: Cryptographic session tokens (`jose` JWT) stored in secure, HttpOnly, SameSite cookies with `bcryptjs` password hashing
- **Authorization**: Server-side Role-Based Access Control (RBAC) separating `ADMIN` and `USER` privileges

---

## Demo Credentials (Development & Testing)

The database seed provides two preconfigured operator accounts:

| Role | Email | Username | Default Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@tssb.local` | `admin` | `Admin123!` | Global cluster control, user role management, system health, settings |
| **Operator / User** | `user@tssb.local` | `kaiti` | `User123!` | Server provisioning, service configuration, runbook authoring, self-audit |

---

## Core Features & Modules

1. **Interactive 3D Swap-Card Authentication (`/login`, `/register`)**
   - 3D perspective transition smoothly swapping between Sign In and Registration without page reloads.
   - SVG eye/eye-off password visibility toggles.
   - Live password strength evaluation meter.
   - Server-side email and username uniqueness enforcement.

2. **System Overview Dashboard (`/dashboard`)**
   - Real PostgreSQL metric calculations: Total Users, Online Servers, Active Services, and Runbooks.
   - Real-time Server Status table with status indicators (Healthy, Degraded, Down).
   - Live SVG Infrastructure Visualization illustrating the request lifecycle.
   - Interactive SVG Network Topology map.
   - RBAC User Management directory table with search, role filters, and pagination.

3. **Server Administration (`/servers`, `/servers/[id]`)**
   - Provisioning, searching, filtering (by status and type: Web, DNS, DB, Mail, App, File).
   - Detailed server view displaying attached daemons, network interfaces, tagged runbooks, and registration history.
   - Lifecycle mutations (online, maintenance, offline) and decommission dialogs.

4. **Service Daemon Management (`/services`)**
   - Host-linked service configuration (Nginx, BIND9, PostgreSQL, Redis, Postfix, OpenSSH).
   - Port (1–65535), protocol, status, and version telemetry.

5. **Network Infrastructure & Topology (`/network`)**
   - Interface binding (`eth0`, `bond0.200`, `ens192`), static IP allocation, subnet mask, gateway, DNS resolvers, and VLAN tagging.
   - Interactive SVG topology visualization.

6. **Operational Runbooks & Documentation (`/documentation`, `/documentation/[id]`)**
   - Knowledge base categorized by Installation, Configuration, Networking, Security, Troubleshooting, and Maintenance.
   - Reading view with copyable raw snippets, author metadata, and server linkage.

7. **Transactional Audit Logging (`/activity`)**
   - Immutable security and mutation event trail recording operator, entity, timestamp, and source IP.
   - RBAC filtered: administrators view all events; operators view their own.

8. **Operator Profile & Security (`/profile`, `/profile/security`)**
   - Profile updates with cyber avatars and infrastructure ownership summary.
   - Cryptographic password changing with verification and audit recording.

9. **Admin Control Center (`/admin`, `/admin/users`, `/admin/users/[id]`, `/admin/settings`)**
   - Cluster health distribution ratios and IAM user growth metrics.
   - Operator management table: change roles, activate/deactivate, delete accounts (with self-protection safeguards).
   - Diagnostic health check pinging Neon PostgreSQL with latency reporting (all secrets strictly masked).

---

## Environment Configuration

Create a `.env` file in the root of the project (refer to `.env.example`):

```bash
# Neon PostgreSQL Connection Pooler URL (with sslmode=require)
DATABASE_URL="postgresql://[user]:[password]@[neon-hostname]/neondb?sslmode=require"

# Direct URL for Prisma migrations (non-pooled)
DIRECT_URL="postgresql://[user]:[password]@[neon-hostname]/neondb?sslmode=require"

# Cryptographic Session / JWT Secret (minimum 32 characters)
AUTH_SECRET="tssb_super_secret_production_key_minimum_32_characters_long"

# Base Application URL
NEXTAUTH_URL="http://localhost:3000"

# Application Environment
NODE_ENV="development"
```

---

## Neon PostgreSQL Setup Guide

1. Navigate to [Neon Console](https://console.neon.tech) and create a new project named `tssb-infrastructure`.
2. Select your preferred AWS region (e.g., `us-east-2` or `eu-central-1`).
3. In the **Connection Details** dashboard:
   - Select **Connection string** > **Pooled connection** and copy the URI into `DATABASE_URL`.
   - Select **Direct connection** and copy the URI into `DIRECT_URL`.
4. Run migrations and seed data:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init_tssb
   npx prisma db seed
   ```

---

## Local Development & Build Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Apply database migrations
npx prisma migrate dev

# 4. Populate development seed data
npm run db:seed

# 5. Start development server
npm run dev

# 6. Run production build
npm run build

# 7. Start production server
npm start
```

---

## Vercel Deployment Instructions

1. Push your repository to GitHub (ensure `.env` is ignored by `.gitignore`).
2. Navigate to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. In **Project Settings** > **Environment Variables**, configure:
   - `DATABASE_URL`: Your pooled Neon connection string.
   - `DIRECT_URL`: Your unpooled Neon connection string.
   - `AUTH_SECRET`: A generated 32+ character random string.
   - `NEXTAUTH_URL`: Your production Vercel domain (`https://your-project.vercel.app`).
4. Build Command: `prisma generate && next build`
5. Output Directory: `.next`
6. Click **Deploy**. Vercel will build and serve your platform globally across edge nodes.

---

## Project Structure

```
TSSB-WEB/
├── prisma/
│   ├── schema.prisma            # PostgreSQL relational models & indexes
│   └── seed.ts                  # Realistic enterprise seed data
├── src/
│   ├── app/
│   │   ├── api/                 # Secure Route Handlers (auth, servers, services, network, docs, admin)
│   │   ├── dashboard/           # Main System Overview Dashboard
│   │   ├── servers/             # Server cluster management & [id] detail
│   │   ├── services/            # Service daemon management
│   │   ├── network/             # Network configuration & VLANs
│   │   ├── documentation/       # Operational runbooks & [id] viewer
│   │   ├── activity/            # Audit event timeline
│   │   ├── profile/             # Profile & security credentials
│   │   ├── admin/               # Admin control center, users, & settings
│   │   ├── login/               # Interactive 3D swap-card login
│   │   ├── register/            # Interactive 3D swap-card registration
│   │   ├── layout.tsx           # Root layout with theme & toasts
│   │   ├── page.tsx             # Public landing page with live visualizations
│   │   └── globals.css          # Design tokens & 3D perspective styles
│   ├── components/
│   │   ├── auth/                # 3D swap card & password strength
│   │   ├── layout/              # AppShell, Sidebar, Topbar, MobileNav, ThemeToggle
│   │   ├── dashboard/           # Metric cards, server table, user table
│   │   ├── visualizations/      # SVG infrastructure flow & network topology
│   │   ├── servers/             # Server CRUD & detail views
│   │   ├── services/            # Service CRUD views
│   │   ├── network/             # Network interface CRUD views
│   │   ├── documentation/       # Runbook views
│   │   ├── activity/            # Audit trail views
│   │   ├── admin/               # Admin views, role modal, settings
│   │   └── common/              # Status badges, confirm dialog, refresh button, logo
│   ├── lib/
│   │   ├── auth.ts              # JWT & bcrypt hashing
│   │   ├── db.ts                # Prisma singleton & safe health check
│   │   ├── session.ts           # Server-side auth & RBAC guards
│   │   ├── activity.ts          # Audit logging helper
│   │   ├── validations.ts       # Zod schemas
│   │   └── utils.ts             # Tailwind merge & date utilities
│   ├── types/
│   │   └── index.ts             # Shared interfaces & enum types
│   └── middleware.ts            # Edge route protection & RBAC redirection
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Security Compliance & Zero-Emoji Policy

- **No Plaintext Passwords**: Password hashing uses bcrypt with 10 salt rounds.
- **No Secret Exposure**: Route `/api/admin/settings/health` safely tests PostgreSQL without displaying passwords or connection strings.
- **Zero Emoji Standard**: Strictly verified across all source files, UI elements, labels, empty states, and system notifications. All iconography uses Lucide React SVGs.
