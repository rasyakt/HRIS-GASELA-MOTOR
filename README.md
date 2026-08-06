# GaselaPulse — HRIS Gasela Motor

<div align="center">
  <img src="gasela_motor.png" alt="Gasela Motor Logo" width="160" style="border-radius: 20px; margin-bottom: 20px;" />
  <p><strong>GaselaPulse</strong> is an enterprise-grade, full-stack Human Resource Information System (HRIS) custom-tailored for <strong>Gasela Motor</strong>. Designed as a high-performance monorepo, it manages attendance tracking, payroll processing (including tax and benefits calculations), leave management, overtime, and corporate communications across web and mobile platforms.</p>
</div>

---

## Key Features

### Web Portal (HRD, Managers, & Owners)
*   **Analytics Dashboard**: Real-time stats on attendance rates, pending leaves, overtime, and payroll summaries.
*   **Employee Directory**: Comprehensive profiles with personal records, bank account details, and employment history.
*   **Leave & Overtime Management**: Centralized workflows for managers and HRD to review, approve, or reject employee requests.
*   **Advanced Payroll Engine**: Automatic calculation of basic salary, allowances, overtime pay, employee-side BPJS deductions, company-side BPJS contributions, and TER-based PPh21 income tax. Generates digital payslips and handles PDF downloads.
*   **Communications**: Post-company announcements with customized priority levels (Low, Normal, High, Urgent).

### Mobile App (Employees)
*   **Dynamic Theme Engine**: Premium UI/UX design featuring smooth micro-animations, glassmorphism elements, and seamless support for dark and light modes.
*   **GPS-Validated Attendance**: Instant check-in/out validating employee location coordinates against the authorized office boundaries.
*   **Self-Service Portal**: Submit leave applications, check overtime requests, review remaining leave quotas via interactive progress charts, and access detailed monthly payslips.
*   **Announcement Stream**: Stay informed with push notifications and read-tracking systems for corporate announcements.
*   **Security & Persistence**: Safe logins with persistent "Remember Me" authentication using Expo SecureStore and secure storage wrappers.

---

## Monorepo Architecture

This project is configured as a Monorepo powered by **pnpm workspaces** and **Turborepo** for optimized task execution, caching, and builds.

```
├── apps/
│   ├── backend/       # NestJS core API (REST API + Prisma ORM + MySQL)
│   ├── web/           # Next.js 14 (App Router, Tailwind CSS, Lucide Icons)
│   └── mobile/        # React Native (Expo SDK 57, Reanimated, Lucide Icons)
├── packages/
│   ├── shared-types/  # Zod schemas & TypeScript types (Single Source of Truth)
│   ├── shared-config/ # Unified configurations (ESLint, Prettier, TypeScript)
│   └── shared-utils/  # Shared date formats, currency helper, BPJS multipliers
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Tech Stack

*   **Languages**: TypeScript (ESNext)
*   **Backend**: NestJS, Prisma ORM, MySQL
*   **Web Frontend**: Next.js 14, Tailwind CSS, TanStack Query (React Query)
*   **Mobile Frontend**: React Native, Expo, React Navigation, React Native Reanimated, Zustand
*   **Workspace Tooling**: Turborepo, pnpm

---

## Local Development Setup

### Prerequisite Checklist
*   **Node.js**: version `20.x` or higher
*   **pnpm**: version `9.x` or higher (`npm install -g pnpm`)
*   **Database**: MySQL 8.x (using Laragon, XAMPP, or a Docker container)

### Step-by-Step Installation

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd HRIS-GASELA
    ```

2.  **Install Monorepo Dependencies**
    ```bash
    pnpm install
    ```

3.  **Environment Setup**
    Copy env configurations from templates:
    ```bash
    # Root .env template (if applicable)
    cp .env.example .env
    
    # Backend environment setup
    cp apps/backend/.env.example apps/backend/.env
    ```
    *Open `apps/backend/.env` and update the `DATABASE_URL` with your local MySQL credentials.*

4.  **Database Migration & Seeding**
    Run Prisma migrations and seed your database with sample employees, roles, and attendance records:
    ```bash
    # Apply database schema
    pnpm --filter @gasela/backend prisma:migrate
    
    # Seed mock data
    pnpm --filter @gasela/backend prisma:seed
    ```

5.  **Start All Development Servers**
    Start NestJS, Next.js, and Expo Metro Bundler simultaneously with a single command:
    ```bash
    pnpm dev
    ```

---

## 🌐 IP Auto-Configuration (Zero-Config Dev)

To make mobile testing on physical devices seamless, the mobile application features **Zero-Configuration local network resolution**:
*   The mobile app's API client uses `expo-constants` to dynamically read the host IP from the running Metro Bundler instance.
*   It automatically maps connection requests to port `3001` (NestJS backend).
*   **No more changing `.env` files or hardcoding IP addresses** when your local WiFi connection shifts or your machine's IP rotates!

---

## Scripts Reference

Execute these commands from the root directory:

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Run all applications concurrently in hot-reload mode |
| `pnpm build` | Build production bundles for NestJS, Next.js, and Expo |
| `pnpm lint` | Run ESLint check across all workspaces |
| `pnpm typecheck` | Perform TypeScript compilers compilation check (`tsc`) |
| `pnpm test` | Run unit and integration tests |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the file for details.

---
<div align="center">
  <p>© 2026 Gasela Motor. All rights reserved.</p>
</div>