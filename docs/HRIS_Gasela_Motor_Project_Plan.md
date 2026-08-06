# PROJECT PLAN — SISTEM HRIS GASELA MOTOR
### Full Stack Implementation Plan (Backend + Web + Mobile) — Siap Dieksekusi AI Coding Agent

> Dokumen ini adalah turunan eksekusi dari `PROMPT_NGODING_PAKE_AI.md` yang sudah kamu siapkan. Semua keputusan teknis yang tadinya "pilih yang terbaik" sudah difinalisasi di sini beserta alasannya, ditambah skema Prisma lengkap, kode kunci, roadmap sprint, dan strategi deployment — supaya bisa langsung dipecah jadi task-task untuk AI agent (Antigravity/Claude Code) tanpa perlu keputusan arsitektur lagi di tengah jalan.

---

## 0. RINGKASAN KEPUTUSAN STACK (FINAL)

| Layer | Pilihan Final | Alasan Singkat |
|---|---|---|
| Backend framework | **NestJS + TypeScript** | Struktur modular (module/controller/service/DTO) yang konsisten → AI agent lebih kecil kemungkinan "mengarang" struktur sendiri. Guard/Decorator built-in cocok untuk RBAC 5 role. Swagger native. |
| ORM | **Prisma** | Sesuai permintaan eksplisit di prompt; schema-first, migration jelas, type-safe client. |
| Database | **MySQL 8.0 (InnoDB)** | Sesuai requirement. |
| Auth | **Passport JWT** (access 15m + refresh token rotation 7d) | Standard, mudah diaudit. |
| Validasi | **Zod** (dipakai di backend via `nestjs-zod`, dan di web/mobile via React Hook Form) | Satu bahasa validasi di 3 layer → schema bisa di-share lewat monorepo package, mengurangi duplikasi & drift. |
| Frontend web | **Next.js 14+ (App Router) + TypeScript** | SSR/SSG untuk dashboard cepat, file-based routing memudahkan AI agent generate halaman per modul. |
| UI Library | **Tailwind CSS + shadcn/ui** | Komponen di-copy langsung ke repo (bukan black-box npm package) → mudah dimodifikasi AI agent, aksesibel (berbasis Radix). |
| Server state | **TanStack Query** | Cache & sinkronisasi data server (attendance, leave, payroll) — pairing alami dengan TanStack Table yang sudah dipilih. |
| Client state | **Zustand** | Untuk state ringan (session, sidebar, UI toggle) — lebih sedikit boilerplate dibanding Redux Toolkit untuk skala 25–100 user. |
| Form | **React Hook Form + Zod** | Sesuai requirement. |
| Table | **TanStack Table v8** | Sesuai requirement. |
| Chart | **Recharts** | Sesuai requirement, integrasi React natural. |
| Mobile | **React Native (Expo, dev client / EAS Build)** | Dipilih di atas Flutter karena bisa **share TypeScript types & Zod schema** dengan backend/web lewat monorepo — konsistensi tipe data jauh lebih terjaga untuk AI-agent-driven dev. Expo dev client dipakai (bukan Expo Go) karena butuh native module (maps, camera, FCM). |
| Mobile navigation | **React Navigation v6** | Sesuai requirement. |
| Mobile state | **Zustand + TanStack Query** | Konsisten dengan web, mengurangi pola berbeda antar platform. |
| Offline mobile | **MMKV (storage) + antrian aksi (sync queue) di tabel lokal** | Lebih cepat & reliable dibanding AsyncStorage murni untuk queue check-in/leave saat offline. |
| Push notification | **Firebase Cloud Messaging (FCM)** | Sesuai requirement. |
| Monorepo tooling | **pnpm workspaces + Turborepo** | Memungkinkan `packages/shared-types` (Zod schema + TS types) dipakai backend, web, dan mobile sekaligus — mengurangi risiko kontrak API berubah tanpa sinkron ke 3 aplikasi. |
| File storage | **Local disk (`uploads/`) di Fase 1–2 → S3-compatible (Cloudflare R2/MinIO) saat scaling** | Mulai simpel, migrasi mudah karena Multer config diabstraksi di satu service. |
| Deployment | **Docker Compose di VPS + Nginx reverse proxy + GitHub Actions CI/CD** | Kontrol penuh, biaya terprediksi untuk skala 25–100 user; alternatif cepat: Railway/Render bila ingin skip setup VPS di awal. |

**Kenapa monorepo?** Karena backend, web, dan mobile berbagi banyak kontrak data yang sama (DTO, enum status, response shape). Dengan `packages/shared-types`, AI agent tinggal generate/edit skema Zod sekali, lalu backend, web, dan mobile otomatis punya tipe yang sinkron — ini mengurangi salah satu sumber bug paling umum di project full-stack yang dikerjakan cepat.

---

## 1. STRUKTUR MONOREPO

```
gasela-hris/
├── apps/
│   ├── backend/                # NestJS API
│   ├── web/                    # Next.js (HRD/Manager/Owner portal)
│   └── mobile/                 # React Native (Expo) - app karyawan
├── packages/
│   ├── shared-types/           # Zod schemas + TS types + enum (single source of truth)
│   ├── shared-config/          # eslint, tsconfig, prettier base config
│   └── shared-utils/           # date/currency formatter, konstanta (BPJS rate, dsb)
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx/default.conf
├── docs/
│   ├── ERD.md
│   ├── API.md
│   └── RUNBOOK.md
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
└── README.md
```

### 1.1 Backend (`apps/backend/`)
```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/        # @Roles(), @CurrentUser()
│   │   ├── guards/            # JwtAuthGuard, RolesGuard, OwnershipGuard
│   │   ├── filters/           # HttpExceptionFilter (format error konsisten)
│   │   ├── interceptors/      # ResponseInterceptor, LoggingInterceptor
│   │   └── utils/             # geo.util.ts, tax.util.ts, bpjs.util.ts
│   ├── config/                # configuration.ts + validasi env pakai Zod
│   ├── prisma/                # PrismaService (extends PrismaClient), PrismaModule
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── employees/
│       ├── departments/
│       ├── positions/
│       ├── attendances/
│       ├── shifts/
│       ├── leaves/
│       ├── overtime/
│       ├── payroll/
│       ├── announcements/
│       ├── dashboard/
│       ├── reports/
│       └── uploads/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── test/                       # e2e tests (Supertest)
├── uploads/                    # gitignored — dev only
├── .env.example
└── package.json
```
Setiap module (mis. `employees/`) berisi pola konsisten:
```
employees/
├── employees.module.ts
├── employees.controller.ts
├── employees.service.ts
├── employees.repository.ts     # opsional: isolasi query Prisma dari service
└── dto/
    ├── create-employee.dto.ts
    ├── update-employee.dto.ts
    └── query-employee.dto.ts
```

### 1.2 Web (`apps/web/`)
```
web/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (portal)/
│   │   │   ├── layout.tsx            # sidebar + role-based nav
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── employees/{page.tsx,[id]/page.tsx,new/page.tsx}
│   │   │   ├── attendance/{page.tsx,report/page.tsx}
│   │   │   ├── leave/{page.tsx,approval/page.tsx}
│   │   │   ├── overtime/page.tsx
│   │   │   ├── payroll/{page.tsx,[id]/page.tsx,generate/page.tsx}
│   │   │   ├── announcements/page.tsx
│   │   │   └── settings/{departments,positions,shifts,leave-types,salary-components}/page.tsx
│   │   └── layout.tsx
│   ├── components/{ui,layout,features}/
│   ├── hooks/                        # useEmployees(), useAttendanceToday(), dst (TanStack Query)
│   ├── lib/{api-client.ts,query-client.ts}
│   ├── store/                        # Zustand: auth-store, ui-store
│   ├── middleware.ts                 # proteksi route per role
│   └── types/ → re-export dari packages/shared-types
├── .env.example
└── package.json
```

### 1.3 Mobile (`apps/mobile/`)
```
mobile/
├── src/
│   ├── screens/
│   │   ├── auth/LoginScreen.tsx
│   │   ├── home/HomeScreen.tsx
│   │   ├── attendance/{CheckInScreen.tsx,HistoryScreen.tsx}
│   │   ├── leave/{LeaveFormScreen.tsx,LeaveListScreen.tsx,ApprovalScreen.tsx}
│   │   ├── overtime/OvertimeScreen.tsx
│   │   ├── payroll/PayslipScreen.tsx
│   │   ├── announcements/AnnouncementScreen.tsx
│   │   └── profile/ProfileScreen.tsx
│   ├── navigation/{RootNavigator.tsx,TabNavigator.tsx}
│   ├── components/
│   ├── services/{api-client.ts,location.service.ts,camera.service.ts,fcm.service.ts}
│   ├── store/                        # Zustand
│   └── offline/{queue.ts,sync.ts}    # antrian aksi offline + auto-sync
├── app.json                          # Expo config: permission lokasi & kamera
├── eas.json
└── package.json
```

---

## 2. SKEMA DATABASE — PRISMA SCHEMA LENGKAP

Migration strategy: `prisma migrate dev` untuk lokal, `prisma migrate deploy` untuk staging/production. Seed data (`prisma/seed.ts`) mengisi: departemen & posisi awal, shift default, jenis cuti standar (cuti tahunan, sakit, menikah, dll sesuai UU Ketenagakerjaan), komponen gaji default, akun admin pertama, dan holiday calendar tahun berjalan.

Tiga tabel di bawah (`Holiday`, `CompanySetting`, `TerRate`) **tidak ada di spesifikasi awal** tapi dibutuhkan supaya modul "System Configuration" dan payroll engine benar-benar bisa jalan — ditambahkan sebagai gap-fill, ditandai jelas.

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ===================== ENUMS =====================
enum EmploymentStatus { active probation resigned terminated }
enum EmploymentType   { permanent contract magang }
enum FamilyRelation    { spouse child parent sibling }
enum Gender             { male female }
enum AttendanceStatus  { present late early_leave absent leave holiday }
enum LeaveReqStatus    { pending approved rejected cancelled }
enum OvertimeStatus    { pending approved rejected }
enum PayrollStatus     { draft pending_approval approved paid }
enum ComponentType     { allowance deduction }
enum CalculationType   { fixed percentage formula }
enum AnnouncementPriority { low normal high urgent }
enum TargetAudience    { all department position specific }
enum UserRole           { admin hrd manager employee owner }
enum DocumentType {
  ktp npwp ijazah sertifikat kontrak skck foto cv other
}
enum ReviewStatus  { draft submitted completed }
enum AssetStatus   { assigned returned }
enum TerCategory   { A B C } // kategori Tarif Efektif Rata-rata PPh21

// ===================== CORE =====================
model Department {
  id                 Int       @id @default(autoincrement()) @map("department_id")
  code               String    @unique @map("department_code") @db.VarChar(10)
  name               String    @map("department_name") @db.VarChar(100)
  parentId           Int?      @map("parent_department_id")
  parent             Department?  @relation("DeptHierarchy", fields: [parentId], references: [id])
  children           Department[] @relation("DeptHierarchy")
  headEmployeeId     Int?      @map("head_of_department")
  headEmployee       Employee? @relation("DepartmentHead", fields: [headEmployeeId], references: [id])
  isActive           Boolean   @default(true) @map("is_active")
  createdAt          DateTime  @default(now()) @map("created_at")

  employees          Employee[] @relation("DepartmentMembers")

  @@map("departments")
}

model Position {
  id             Int      @id @default(autoincrement()) @map("position_id")
  code           String   @unique @map("position_code") @db.VarChar(10)
  name           String   @map("position_name") @db.VarChar(100)
  jobDescription String?  @map("job_description") @db.Text
  level          Int?
  minSalary      Decimal? @map("min_salary") @db.Decimal(15, 2)
  maxSalary      Decimal? @map("max_salary") @db.Decimal(15, 2)
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")

  employees      Employee[]

  @@map("positions")
}

model Employee {
  id                     Int              @id @default(autoincrement()) @map("employee_id")
  employeeNumber         String           @unique @map("employee_number") @db.VarChar(20)
  fullName               String           @map("full_name") @db.VarChar(100)
  email                  String           @unique @db.VarChar(100)
  phone                  String?          @db.VarChar(20)
  birthDate              DateTime?        @map("birth_date") @db.Date
  idCardNumber           String?          @unique @map("id_card_number") @db.VarChar(20)
  taxNumber              String?          @map("tax_number") @db.VarChar(20)
  address                String?          @db.Text
  emergencyContactName   String?          @map("emergency_contact_name") @db.VarChar(100)
  emergencyContactPhone  String?          @map("emergency_contact_phone") @db.VarChar(20)
  departmentId           Int?             @map("department_id")
  department             Department?      @relation("DepartmentMembers", fields: [departmentId], references: [id])
  positionId             Int?             @map("position_id")
  position               Position?        @relation(fields: [positionId], references: [id])
  managerId              Int?             @map("reports_to")
  manager                Employee?        @relation("EmployeeHierarchy", fields: [managerId], references: [id])
  subordinates           Employee[]       @relation("EmployeeHierarchy")
  joinDate               DateTime         @map("join_date") @db.Date
  permanentDate          DateTime?        @map("permanent_date") @db.Date
  resignDate             DateTime?        @map("resign_date") @db.Date
  employmentStatus       EmploymentStatus @default(probation) @map("employment_status")
  employmentType         EmploymentType   @map("employment_type")
  basicSalary            Decimal          @map("basic_salary") @db.Decimal(15, 2)
  bankAccountName        String?          @map("bank_account_name") @db.VarChar(100)
  bankAccountNumber      String?          @map("bank_account_number") @db.VarChar(30)
  bankName               String?          @map("bank_name") @db.VarChar(50)
  profilePhotoUrl        String?          @map("profile_photo_url") @db.VarChar(255)
  isActive               Boolean          @default(true) @map("is_active")
  createdAt              DateTime         @default(now()) @map("created_at")
  updatedAt              DateTime         @updatedAt @map("updated_at")

  user                   User?
  departmentsHeaded      Department[]        @relation("DepartmentHead")
  familyMembers          FamilyMember[]
  attendances            Attendance[]
  leaveBalances          LeaveBalance[]
  leaveRequests          LeaveRequest[]      @relation("LeaveOwner")
  leaveApprovals         LeaveRequest[]      @relation("LeaveApprover")
  overtimeRequests       OvertimeRequest[]   @relation("OvertimeOwner")
  overtimeApprovals      OvertimeRequest[]   @relation("OvertimeApprover")
  payrolls               Payroll[]           @relation("PayrollOwner")
  payrollApprovals       Payroll[]           @relation("PayrollApprover")
  documents               EmployeeDocument[]
  reviewsReceived         PerformanceReview[] @relation("Reviewee")
  reviewsGiven             PerformanceReview[] @relation("Reviewer")
  trainingRecords          TrainingRecord[]
  assetAssignments         AssetAssignment[]
  announcementsCreated     Announcement[]
  announcementReads        AnnouncementRead[]

  @@map("employees")
}

model FamilyMember {
  id                Int             @id @default(autoincrement()) @map("family_id")
  employeeId        Int             @map("employee_id")
  employee          Employee        @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  fullName          String          @map("full_name") @db.VarChar(100)
  relationship      FamilyRelation
  idCardNumber      String?         @map("id_card_number") @db.VarChar(20)
  birthDate         DateTime?       @map("birth_date") @db.Date
  gender            Gender?
  isBpjsDependent   Boolean         @default(false) @map("is_bpjs_dependent")
  isActive          Boolean         @default(true) @map("is_active")

  @@map("family_members")
}

model User {
  id            Int       @id @default(autoincrement()) @map("user_id")
  employeeId    Int       @unique @map("employee_id")
  employee      Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  username      String    @unique @db.VarChar(50)
  passwordHash  String    @map("password_hash") @db.VarChar(255)
  role          UserRole
  refreshTokenHash String? @map("refresh_token_hash") @db.VarChar(255)
  lastLogin     DateTime? @map("last_login")
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")

  @@map("users")
}

// ===================== ATTENDANCE =====================
model Shift {
  id                  Int      @id @default(autoincrement()) @map("shift_id")
  name                String   @map("shift_name") @db.VarChar(50)
  startTime            DateTime @map("start_time") @db.Time()
  endTime               DateTime @map("end_time") @db.Time()
  gracePeriodMinutes   Int      @default(15) @map("grace_period_minutes")
  workHours            Decimal  @map("work_hours") @db.Decimal(5, 2)
  isActive             Boolean  @default(true) @map("is_active")

  attendances          Attendance[]

  @@map("shifts")
}

model Attendance {
  id                  Int               @id @default(autoincrement()) @map("attendance_id")
  employeeId          Int               @map("employee_id")
  employee            Employee          @relation(fields: [employeeId], references: [id])
  attendanceDate       DateTime          @map("attendance_date") @db.Date
  checkInTime          DateTime?         @map("check_in_time") @db.Time()
  checkOutTime         DateTime?         @map("check_out_time") @db.Time()
  checkInLat           Decimal?          @map("check_in_lat") @db.Decimal(10, 7)
  checkInLng           Decimal?          @map("check_in_lng") @db.Decimal(10, 7)
  checkOutLat          Decimal?          @map("check_out_lat") @db.Decimal(10, 7)
  checkOutLng          Decimal?          @map("check_out_lng") @db.Decimal(10, 7)
  shiftId               Int?              @map("shift_id")
  shift                  Shift?            @relation(fields: [shiftId], references: [id])
  status                 AttendanceStatus  @default(present)
  lateMinutes            Int               @default(0) @map("late_minutes")
  earlyLeaveMinutes      Int               @default(0) @map("early_leave_minutes")
  workHours               Decimal           @default(0) @map("work_hours") @db.Decimal(5, 2)
  notes                   String?           @db.Text
  checkInPhotoUrl          String?           @map("check_in_photo_url") @db.VarChar(255)
  checkOutPhotoUrl         String?           @map("check_out_photo_url") @db.VarChar(255)
  createdAt                 DateTime          @default(now()) @map("created_at")

  @@unique([employeeId, attendanceDate], name: "uq_employee_date")
  @@index([employeeId, attendanceDate])
  @@map("attendances")
}

// ===================== LEAVE =====================
model LeaveType {
  id                    Int       @id @default(autoincrement()) @map("leave_type_id")
  code                   String    @unique @map("leave_type_code") @db.VarChar(10)
  name                    String    @map("leave_type_name") @db.VarChar(50)
  annualQuota             Int       @map("annual_quota")
  isPaid                   Boolean   @default(true) @map("is_paid")
  requiresDocument         Boolean   @default(false) @map("requires_document")
  maxConsecutiveDays       Int?      @map("max_consecutive_days")
  minNoticeDays             Int?      @map("min_notice_days")
  isActive                   Boolean   @default(true) @map("is_active")

  balances                   LeaveBalance[]
  requests                    LeaveRequest[]

  @@map("leave_types")
}

model LeaveBalance {
  id            Int       @id @default(autoincrement()) @map("balance_id")
  employeeId    Int       @map("employee_id")
  employee      Employee  @relation(fields: [employeeId], references: [id])
  leaveTypeId   Int       @map("leave_type_id")
  leaveType     LeaveType @relation(fields: [leaveTypeId], references: [id])
  year          Int
  quota         Int
  used          Int       @default(0)
  remaining     Int
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@unique([employeeId, leaveTypeId, year])
  @@map("leave_balances")
}

model LeaveRequest {
  id               Int             @id @default(autoincrement()) @map("leave_request_id")
  requestNumber    String          @unique @map("request_number") @db.VarChar(30)
  employeeId       Int             @map("employee_id")
  employee         Employee        @relation("LeaveOwner", fields: [employeeId], references: [id])
  leaveTypeId      Int             @map("leave_type_id")
  leaveType        LeaveType       @relation(fields: [leaveTypeId], references: [id])
  startDate         DateTime        @map("start_date") @db.Date
  endDate            DateTime        @map("end_date") @db.Date
  totalDays           Int             @map("total_days")
  reason               String?         @db.Text
  documentUrl           String?         @map("document_url") @db.VarChar(255)
  status                 LeaveReqStatus  @default(pending)
  approvedById           Int?            @map("approved_by")
  approvedBy              Employee?       @relation("LeaveApprover", fields: [approvedById], references: [id])
  approvedAt               DateTime?       @map("approved_at")
  rejectionReason           String?         @map("rejection_reason") @db.Text
  createdAt                 DateTime        @default(now()) @map("created_at")

  @@map("leave_requests")
}

// ===================== OVERTIME =====================
model OvertimeRequest {
  id             Int            @id @default(autoincrement()) @map("overtime_id")
  requestNumber   String         @unique @map("request_number") @db.VarChar(30)
  employeeId       Int            @map("employee_id")
  employee          Employee       @relation("OvertimeOwner", fields: [employeeId], references: [id])
  overtimeDate       DateTime       @map("overtime_date") @db.Date
  startTime            DateTime       @map("start_time") @db.Time()
  endTime                DateTime       @map("end_time") @db.Time()
  hours                    Decimal        @db.Decimal(5, 2)
  purpose                    String?        @db.Text
  status                       OvertimeStatus @default(pending)
  approvedById                 Int?           @map("approved_by")
  approvedBy                     Employee?      @relation("OvertimeApprover", fields: [approvedById], references: [id])
  approvedAt                     DateTime?      @map("approved_at")
  createdAt                       DateTime       @default(now()) @map("created_at")

  @@map("overtime_requests")
}

// ===================== PAYROLL =====================
model SalaryComponent {
  id               Int              @id @default(autoincrement()) @map("salary_component_id")
  code              String           @unique @map("component_code") @db.VarChar(10)
  name               String           @map("component_name") @db.VarChar(100)
  type                 ComponentType
  calculationType        CalculationType @map("calculation_type")
  defaultAmount            Decimal?        @map("default_amount") @db.Decimal(15, 2)
  isTaxable                  Boolean         @default(true) @map("is_taxable")
  isActive                     Boolean         @default(true) @map("is_active")

  payrollComponents             PayrollComponent[]

  @@map("salary_components")
}

model Payroll {
  id                          Int            @id @default(autoincrement()) @map("payroll_id")
  payrollNumber                String         @unique @map("payroll_number") @db.VarChar(30)
  employeeId                    Int            @map("employee_id")
  employee                        Employee       @relation("PayrollOwner", fields: [employeeId], references: [id])
  month                              Int
  year                                Int
  basicSalary                          Decimal        @map("basic_salary") @db.Decimal(15, 2)
  totalAllowance                        Decimal        @default(0) @map("total_allowance") @db.Decimal(15, 2)
  totalDeduction                          Decimal        @default(0) @map("total_deduction") @db.Decimal(15, 2)
  overtimePay                               Decimal        @default(0) @map("overtime_pay") @db.Decimal(15, 2)
  grossSalary                                 Decimal        @map("gross_salary") @db.Decimal(15, 2)
  bpjsKesehatanEmployee                         Decimal        @default(0) @map("bpjs_kesehatan_employee") @db.Decimal(15, 2)
  bpjsKesehatanCompany                            Decimal        @default(0) @map("bpjs_kesehatan_company") @db.Decimal(15, 2)
  bpjsKetenagakerjaanEmployee                       Decimal        @default(0) @map("bpjs_ketenagakerjaan_employee") @db.Decimal(15, 2)
  bpjsKetenagakerjaanCompany                          Decimal        @default(0) @map("bpjs_ketenagakerjaan_company") @db.Decimal(15, 2)
  taxPph21                                              Decimal        @default(0) @map("tax_pph21") @db.Decimal(15, 2)
  netSalary                                               Decimal        @map("net_salary") @db.Decimal(15, 2)
  status                                                     PayrollStatus  @default(draft)
  approvedById                                               Int?           @map("approved_by")
  approvedBy                                                   Employee?      @relation("PayrollApprover", fields: [approvedById], references: [id])
  approvedAt                                                     DateTime?      @map("approved_at")
  paymentDate                                                     DateTime?      @map("payment_date") @db.Date
  payslipUrl                                                        String?        @map("payslip_url") @db.VarChar(255)
  createdAt                                                          DateTime       @default(now()) @map("created_at")

  components                                                          PayrollComponent[]

  @@unique([employeeId, month, year])
  @@map("payrolls")
}

model PayrollComponent {
  id                  Int             @id @default(autoincrement()) @map("component_id")
  payrollId            Int             @map("payroll_id")
  payroll                Payroll         @relation(fields: [payrollId], references: [id], onDelete: Cascade)
  salaryComponentId       Int             @map("salary_component_id")
  salaryComponent           SalaryComponent @relation(fields: [salaryComponentId], references: [id])
  amount                       Decimal         @db.Decimal(15, 2)
  type                            ComponentType

  @@map("payroll_components")
}

/// Tabel tambahan (di luar spesifikasi awal) — tabel referensi resmi
/// Tarif Efektif Rata-rata (TER) PPh21 bulanan sesuai PMK 168/2023.
/// Data harus diisi dari lampiran resmi DJP, bukan di-hardcode di kode.
model TerRate {
  id            Int         @id @default(autoincrement())
  category       TerCategory
  incomeFrom      Decimal     @map("income_from") @db.Decimal(15, 2)
  incomeTo          Decimal?    @map("income_to") @db.Decimal(15, 2) // null = tanpa batas atas
  ratePercent         Decimal     @map("rate_percent") @db.Decimal(5, 2)

  @@index([category])
  @@map("ter_rates")
}

/// Tabel tambahan — kalender hari libur nasional/perusahaan (dibutuhkan modul
/// "Holiday calendar management" yang disebut di functional requirement
/// tapi belum ada tabelnya di spesifikasi awal).
model Holiday {
  id            Int      @id @default(autoincrement())
  date           DateTime @db.Date
  name            String   @db.VarChar(150)
  isRecurringYearly Boolean  @default(false) @map("is_recurring_yearly")
  createdAt          DateTime @default(now()) @map("created_at")

  @@unique([date])
  @@map("holidays")
}

/// Tabel tambahan — konfigurasi key-value (radius kantor, rate BPJS,
/// lat/lng kantor pusat, dsb) supaya tidak hardcode & bisa diubah tanpa deploy ulang.
model CompanySetting {
  id            Int      @id @default(autoincrement())
  key            String   @unique @db.VarChar(100)
  value            String   @db.Text // simpan sebagai JSON string
  description        String?  @db.Text
  updatedAt             DateTime @updatedAt @map("updated_at")

  @@map("company_settings")
}

// ===================== ANNOUNCEMENT =====================
model Announcement {
  id               Int                  @id @default(autoincrement()) @map("announcement_id")
  title             String               @db.VarChar(200)
  content             String               @db.Text
  priority               AnnouncementPriority @default(normal)
  targetAudience           TargetAudience       @default(all) @map("target_audience")
  publishDate                DateTime             @map("publish_date") @db.Date
  expiryDate                    DateTime?            @map("expiry_date") @db.Date
  createdById                     Int                  @map("created_by")
  createdBy                          Employee             @relation(fields: [createdById], references: [id])
  isPublished                          Boolean              @default(false) @map("is_published")
  createdAt                              DateTime             @default(now()) @map("created_at")

  reads                                    AnnouncementRead[]

  @@map("announcements")
}

model AnnouncementRead {
  id                Int          @id @default(autoincrement()) @map("read_id")
  announcementId     Int          @map("announcement_id")
  announcement         Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  employeeId             Int          @map("employee_id")
  employee                 Employee     @relation(fields: [employeeId], references: [id])
  readAt                     DateTime     @default(now()) @map("read_at")

  @@unique([announcementId, employeeId])
  @@map("announcement_reads")
}

// ===================== DOCUMENTS / PERFORMANCE / TRAINING / ASSET (Phase 3) =====================
model EmployeeDocument {
  id             Int          @id @default(autoincrement()) @map("document_id")
  employeeId      Int          @map("employee_id")
  employee          Employee     @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  documentType        DocumentType @map("document_type")
  documentName           String       @map("document_name") @db.VarChar(200)
  documentUrl               String       @map("document_url") @db.VarChar(255)
  uploadDate                   DateTime     @map("upload_date") @db.Date
  expiryDate                      DateTime?    @map("expiry_date") @db.Date
  createdAt                          DateTime     @default(now()) @map("created_at")

  @@map("employee_documents")
}

model PerformanceReview {
  id                    Int          @id @default(autoincrement()) @map("review_id")
  employeeId             Int          @map("employee_id")
  employee                  Employee     @relation("Reviewee", fields: [employeeId], references: [id])
  reviewerId                  Int          @map("reviewer_id")
  reviewer                       Employee     @relation("Reviewer", fields: [reviewerId], references: [id])
  periodMonth                       Int          @map("period_month")
  periodYear                           Int          @map("period_year")
  reviewDate                              DateTime     @map("review_date") @db.Date
  overallScore                               Decimal?     @map("overall_score") @db.Decimal(5, 2)
  strengths                                     String?      @db.Text
  areasForImprovement                              String?      @map("areas_for_improvement") @db.Text
  goalsNextPeriod                                     String?      @map("goals_next_period") @db.Text
  status                                                 ReviewStatus @default(draft)
  createdAt                                                 DateTime     @default(now()) @map("created_at")

  @@map("performance_reviews")
}

model TrainingRecord {
  id                Int       @id @default(autoincrement()) @map("training_record_id")
  employeeId         Int       @map("employee_id")
  employee              Employee  @relation(fields: [employeeId], references: [id])
  trainingName            String    @map("training_name") @db.VarChar(200)
  trainingProvider           String?   @map("training_provider") @db.VarChar(200)
  startDate                     DateTime  @map("start_date") @db.Date
  endDate                          DateTime  @map("end_date") @db.Date
  durationHours                       Int?      @map("duration_hours")
  certificateUrl                         String?   @map("certificate_url") @db.VarChar(255)
  cost                                      Decimal?  @db.Decimal(15, 2)
  notes                                        String?   @db.Text
  createdAt                                       DateTime  @default(now()) @map("created_at")

  @@map("training_records")
}

model AssetAssignment {
  id                Int         @id @default(autoincrement()) @map("assignment_id")
  employeeId         Int         @map("employee_id")
  employee              Employee    @relation(fields: [employeeId], references: [id])
  assetName               String      @map("asset_name") @db.VarChar(100)
  assetCode                  String      @unique @map("asset_code") @db.VarChar(50)
  serialNumber                  String?     @map("serial_number") @db.VarChar(100)
  assignmentDate                    DateTime    @map("assignment_date") @db.Date
  returnDate                            DateTime?   @map("return_date") @db.Date
  status                                    AssetStatus @default(assigned)
  conditionNotes                              String?     @map("condition_notes") @db.Text
  createdAt                                      DateTime    @default(now()) @map("created_at")

  @@map("asset_assignments")
}
```

> **Catatan migrasi:** urutan `prisma migrate dev` yang aman: (1) Department, Position → (2) Employee, User → (3) Shift, Attendance → (4) LeaveType, LeaveBalance, LeaveRequest → (5) OvertimeRequest → (6) SalaryComponent, Payroll, PayrollComponent, TerRate, CompanySetting, Holiday → (7) Announcement, AnnouncementRead → (8) sisanya (Fase 3). Ini juga jadi urutan pengerjaan modul backend di roadmap Bagian 4.

---

## 3. ROADMAP IMPLEMENTASI (SPRINT-BASED)

Estimasi total **±10–13 minggu** untuk tim kecil yang dibantu AI coding agent, sampai production-ready untuk 25–50 karyawan.

### Fase 0 — Foundation Setup (3–5 hari)
- [ ] Init monorepo (pnpm + Turborepo), setup `packages/shared-types`, `shared-config`
- [ ] Setup NestJS project + Prisma + koneksi MySQL (docker-compose lokal: mysql + adminer)
- [ ] Tulis `schema.prisma` lengkap (Bagian 2) → `migrate dev` → seed awal
- [ ] Setup Next.js project + Tailwind + shadcn/ui + struktur folder
- [ ] Setup Expo project + navigation skeleton + env config
- [ ] Setup ESLint/Prettier bersama, `.env.example` di 3 aplikasi
- [ ] Setup GitHub Actions CI dasar (lint + typecheck + build)

### Fase 1 — MVP / Core (minggu 1–4)
**Minggu 1 — Auth & Employee (backend fokus)**
- [ ] Module `auth`: login, refresh-token, logout, guard JWT, guard role
- [ ] Module `employees`: CRUD, upload foto profil, search/filter, `GET /employees/me`
- [ ] Module `departments`, `positions`: CRUD dasar
- [ ] Swagger aktif di `/api/docs`

**Minggu 2 — Web Employee UI + Attendance backend + Mobile Auth**
- [ ] Web: halaman login, layout dashboard + sidebar per-role, halaman employee list/detail/form
- [ ] Backend: module `attendances` (check-in/out + validasi geofence + hitung telat otomatis), module `shifts`
- [ ] Mobile: layar login, layar check-in/out dengan GPS + kamera (dev client wajib sejak sini)

**Minggu 3 — Leave & Overtime (full stack)**
- [ ] Backend: module `leaves` (request, approval workflow, leave balance), module `overtime`
- [ ] Web: leave request list, approval interface manager, leave calendar sederhana
- [ ] Mobile: form pengajuan cuti/lembur, status tracking, approve/reject (untuk manager)

**Minggu 4 — Dashboard dasar + Hardening Fase 1**
- [ ] Backend: module `dashboard` (endpoint per role: owner/hrd/manager/employee)
- [ ] Web: dashboard cards + chart dasar (Recharts)
- [ ] Mobile: home screen ringkas (status hari ini, sisa cuti, pengumuman terbaru)
- [ ] Testing menyeluruh Fase 1 (unit + e2e kritikal) + bugfix + UAT internal

### Fase 2 — Essential Features (minggu 5–7)
- [ ] Payroll engine (Bagian 5): kalkulasi gaji, BPJS, PPh21 TER, generate payslip PDF
- [ ] Web: payroll generation interface, review & approve, bank transfer file export
- [ ] Mobile: payslip viewer + download PDF
- [ ] Module `announcements` full-stack + push notification (FCM) untuk pengumuman baru
- [ ] Dashboard & report versi lengkap (executive, HRD, manager)
- [ ] Settings module: shift, leave type, salary component, holiday calendar

### Fase 3 — Advanced Features (minggu 8–10)
- [ ] Performance review, training records, asset management, employee documents (CRUD + expiry alert)
- [ ] Advanced analytics + export (Excel/PDF) di `reports`
- [ ] Offline mode mobile (queue check-in/leave saat tanpa sinyal + auto-sync)
- [ ] Audit log untuk approval-approval kritikal
- [ ] Security & performance hardening penuh (Bagian 7), load test ringan (k6/Artillery)
- [ ] Deployment production + UAT final + dokumentasi serah terima

---

## 4. SPESIFIKASI API — TAMBAHAN & CONTOH DETAIL

Struktur endpoint yang sudah kamu susun di prompt awal (auth, employees, departments, positions, attendances, leaves, overtime, payroll, announcements, dashboard, reports) sudah solid dan **dipakai apa adanya**. Tambahan yang perlu dilengkapi:

- `POST /api/uploads` — endpoint generik untuk upload file (dipakai employee photo, dokumen, bukti cuti) dengan validasi tipe/ukuran, mengembalikan URL.
- `GET /api/notifications/me` & `POST /api/notifications/register-device` — untuk registrasi FCM token dari mobile.
- `GET /api/health` — health check untuk load balancer/monitoring.
- `GET /api/settings/company` & `PUT /api/settings/company` — baca/ubah `CompanySetting` (radius kantor, koordinat kantor, rate BPJS aktif).

### Contoh detail request/response (3 endpoint kunci)

**POST `/api/auth/login`**
```json
// Request
{ "username": "budi.santoso", "password": "Str0ngPass!" }

// Response 200
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": 12, "employeeId": 45, "role": "employee",
    "fullName": "Budi Santoso", "department": "Workshop"
  }
}
```

**POST `/api/attendances/check-in`**
```json
// Request (multipart/form-data)
{
  "latitude": -6.914744,
  "longitude": 107.609810,
  "photo": "<file>",
  "shiftId": 1
}

// Response 201
{
  "attendanceId": 5231,
  "status": "present",
  "checkInTime": "08:02:15",
  "lateMinutes": 2,
  "distanceFromOfficeMeters": 34.2
}

// Response 422 (di luar radius kantor)
{ "statusCode": 422, "message": "Lokasi check-in di luar radius kantor (245m dari batas 100m)", "error": "GEOFENCE_VIOLATION" }
```

**POST `/api/payroll/generate`**
```json
// Request
{ "month": 7, "year": 2026, "departmentId": null }

// Response 201
{
  "batchId": "PR-202607-001",
  "totalEmployees": 42,
  "status": "draft",
  "summary": { "totalGross": 512000000, "totalNet": 441300000, "totalPph21": 28750000 }
}
```

---

## 5. KODE KUNCI

### 5.1 RBAC — Decorator & Guard (NestJS)
```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```
```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (!requiredRoles) return true; // endpoint tanpa @Roles() = semua role login boleh akses

    const { user } = ctx.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Penggunaan di controller:
// @Roles('hrd', 'admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Post() createEmployee(@Body() dto: CreateEmployeeDto) { ... }
```

### 5.2 Validasi Geofence Check-in (Haversine)
```typescript
// common/utils/geo.util.ts
/** Jarak antara 2 koordinat dalam meter (formula Haversine). */
export function distanceInMeters(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const R = 6371000; // radius bumi (meter)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```
```typescript
// modules/attendances/attendances.service.ts (potongan relevan)
async checkIn(employeeId: number, dto: CheckInDto) {
  const office = await this.settings.getOfficeLocation(); // dari CompanySetting
  const distance = distanceInMeters(dto.latitude, dto.longitude, office.lat, office.lng);

  if (distance > office.radiusMeters) {
    throw new UnprocessableEntityException({
      error: 'GEOFENCE_VIOLATION',
      message: `Lokasi check-in di luar radius kantor (${Math.round(distance)}m dari batas ${office.radiusMeters}m)`,
    });
  }
  // ... hitung lateMinutes berdasarkan shift, simpan attendance, simpan foto via uploads service
}
```

### 5.3 Payroll Engine — BPJS
```typescript
// common/utils/bpjs.util.ts
// Rate & batas upah di bawah diambil dari riset informasi publik per pertengahan 2026
// (PP 45/2015 & perubahannya). WAJIB divalidasi ulang tim finance/payroll sebelum
// go-live — nilai ini BUKAN nasihat pajak/aktuaria resmi dan bisa berubah kapan saja.
// Sengaja disimpan lewat CompanySetting (bukan hardcode) supaya bisa diupdate tanpa deploy.
export interface BpjsRates {
  kesehatanRateEmployee: number;   // 0.01  (1%)
  kesehatanRateCompany: number;    // 0.04  (4%)
  kesehatanCapSalary: number;      // Rp 12.000.000 (2026)
  jhtRateEmployee: number;         // 0.02  (2%)
  jhtRateCompany: number;          // 0.037 (3.7%)
  jpRateEmployee: number;          // 0.01  (1%)
  jpRateCompany: number;           // 0.02  (2%)
  jpCapSalary: number;             // Rp 10.547.400 (2026)
  jkkRateCompany: number;          // 0.0024–0.0174 tergantung kelas risiko usaha
  jkmRateCompany: number;          // 0.003 (0.3%)
}

export function calculateBpjs(basicSalaryPlusFixedAllowance: number, rates: BpjsRates) {
  const kesehatanBase = Math.min(basicSalaryPlusFixedAllowance, rates.kesehatanCapSalary);
  const jpBase = Math.min(basicSalaryPlusFixedAllowance, rates.jpCapSalary);
  const jhtBase = basicSalaryPlusFixedAllowance; // JHT tidak dibatasi cap

  return {
    kesehatanEmployee: round2(kesehatanBase * rates.kesehatanRateEmployee),
    kesehatanCompany: round2(kesehatanBase * rates.kesehatanRateCompany),
    jhtEmployee: round2(jhtBase * rates.jhtRateEmployee),
    jhtCompany: round2(jhtBase * rates.jhtRateCompany),
    jpEmployee: round2(jpBase * rates.jpRateEmployee),
    jpCompany: round2(jpBase * rates.jpRateCompany),
    jkkCompany: round2(jhtBase * rates.jkkRateCompany),
    jkmCompany: round2(jhtBase * rates.jkmRateCompany),
  };
}

function round2(n: number) { return Math.round(n); } // Rupiah, tanpa desimal
```

### 5.4 Payroll Engine — PPh21 (metode TER, sesuai PMK 168/2023)
```typescript
// common/utils/tax.util.ts
// Sejak Jan 2024, potongan PPh21 BULANAN (masa pajak Jan–Nov) wajib pakai
// metode TER (Tarif Efektif Rata-rata): gross bulanan × tarif TER sesuai
// kategori (A/B/C) berdasar status PTKP. Masa pajak TERAKHIR (Desember)
// dihitung ulang pakai tarif progresif Pasal 17 UU PPh atas total setahun,
// lalu dikurangi total PPh21 yang sudah dipotong Jan–Nov.
//
// Tabel tarif TER lengkap (puluhan baris per kategori) TIDAK di-hardcode di
// sini — diambil dari tabel referensi `TerRate` (di-seed dari lampiran resmi
// PMK 168/2023) supaya mudah diperbarui saat regulasi berubah.

export type PtkpStatus = 'TK0' | 'TK1' | 'TK2' | 'TK3' | 'K0' | 'K1' | 'K2' | 'K3';

const PTKP_TO_TER_CATEGORY: Record<PtkpStatus, 'A' | 'B' | 'C'> = {
  TK0: 'A', TK1: 'A', K0: 'A',
  TK2: 'B', TK3: 'B', K1: 'B', K2: 'B',
  K3: 'C',
};

export async function calculateMonthlyPph21Ter(
  grossMonthlyIncome: number,
  ptkpStatus: PtkpStatus,
  terRateRepository: TerRateRepository, // wrapper query ke tabel TerRate
): Promise<number> {
  const category = PTKP_TO_TER_CATEGORY[ptkpStatus];
  const bracket = await terRateRepository.findBracket(category, grossMonthlyIncome);
  if (!bracket) return 0; // di bawah ambang PTKP terendah kategori tsb → nihil
  return Math.round(grossMonthlyIncome * (Number(bracket.ratePercent) / 100));
}

// Rekonsiliasi masa pajak Desember: tarif progresif Pasal 17 UU HPP
const ANNUAL_BRACKETS = [
  { upTo: 60_000_000, rate: 0.05 },
  { upTo: 250_000_000, rate: 0.15 },
  { upTo: 500_000_000, rate: 0.25 },
  { upTo: 5_000_000_000, rate: 0.30 },
  { upTo: Infinity, rate: 0.35 },
];

export function calculateAnnualPph21Progressive(pkpAnnual: number): number {
  let remaining = pkpAnnual;
  let prevCap = 0;
  let tax = 0;
  for (const b of ANNUAL_BRACKETS) {
    if (remaining <= 0) break;
    const bracketSize = b.upTo - prevCap;
    const taxableInBracket = Math.min(remaining, bracketSize);
    tax += taxableInBracket * b.rate;
    remaining -= taxableInBracket;
    prevCap = b.upTo;
  }
  return Math.round(tax);
}
```

### 5.5 Response & Error Format Konsisten
```typescript
// common/interceptors/response.interceptor.ts
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => ({ success: true, data, timestamp: new Date().toISOString() })),
    );
  }
}

// common/filters/http-exception.filter.ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const body = exception instanceof HttpException ? exception.getResponse() : { message: 'Internal server error' };
    // Jangan expose stack trace / detail internal ke client di production
    res.status(status).json({ success: false, statusCode: status, ...(typeof body === 'object' ? body : { message: body }) });
  }
}
```

### 5.6 Zod DTO shared (dipakai backend + web + mobile)
```typescript
// packages/shared-types/src/leave-request.schema.ts
import { z } from 'zod';

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.number().int().positive(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().min(5).max(500),
}).refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
  message: 'Tanggal selesai harus setelah/sama dengan tanggal mulai',
  path: ['endDate'],
});

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
// → Backend pakai ini via nestjs-zod (ZodValidationPipe)
// → Web/Mobile pakai ini langsung sebagai resolver React Hook Form (zodResolver)
```

---

## 6. KEAMANAN — CHECKLIST EKSEKUSI

- [ ] JWT access token 15 menit, refresh token 7 hari, **refresh token disimpan ter-hash** (bcrypt) di kolom `refreshTokenHash`, rotasi setiap kali dipakai (reuse detection → revoke semua sesi jika refresh token lama dipakai ulang)
- [ ] Password: bcrypt 10 rounds, policy min 8 karakter + uppercase + angka, ditolak di level DTO (Zod `.regex`)
- [ ] RBAC di setiap endpoint kritikal (`@Roles`), plus **row-level check** manual: employee hanya boleh akses data miliknya sendiri (`req.user.employeeId === params.employeeId` atau role HRD/admin)
- [ ] Semua input tervalidasi via Zod di boundary controller — tidak ada raw `req.body` yang langsung dipakai
- [ ] Prisma sudah otomatis parameterized query → aman dari SQL injection selama tidak pakai `$queryRawUnsafe`
- [ ] File upload: whitelist ekstensi (jpg/png/pdf), limit ukuran (mis. 5MB), validasi MIME type asli (bukan cuma dari nama file)
- [ ] Data sensitif (gaji, NPWP, KTP) — batasi field yang dikembalikan di response sesuai role pemanggil (mis. `select` Prisma berbeda untuk role employee vs HRD)
- [ ] CORS: whitelist origin web + mobile app scheme, bukan `*`
- [ ] Rate limiting: `@nestjs/throttler`, 100 req/15 menit per IP untuk endpoint publik (login dsb lebih ketat, mis. 5 req/menit)
- [ ] Audit log tabel terpisah untuk aksi kritikal: login, approve/reject cuti-lembur-payroll, edit data gaji — simpan who/when/what (before-after jika memungkinkan)
- [ ] `.env` tidak pernah masuk git; gunakan `.env.example` sebagai template; secret production dikelola lewat GitHub Actions secrets / vault VPS

---

## 7. TESTING STRATEGY

- **Unit test** (Jest): business logic murni — `calculateBpjs`, `calculateMonthlyPph21Ter`, `distanceInMeters`, kalkulasi late/early-leave attendance.
- **Integration/e2e** (Supertest + test database terpisah): auth flow (login → akses endpoint protected → refresh), attendance check-in dengan skenario dalam/luar radius, leave request → approval → balance berkurang, payroll generate → payslip ter-generate.
- **Contoh test unit:**
```typescript
describe('calculateBpjs', () => {
  it('membatasi dasar perhitungan JP sesuai cap upah', () => {
    const result = calculateBpjs(15_000_000, DEFAULT_BPJS_RATES);
    expect(result.jpEmployee).toBe(Math.round(DEFAULT_BPJS_RATES.jpCapSalary * 0.01));
  });
});
```
- Target coverage Fase 1: **≥ 70%** untuk `services/` dan `utils/` (bukan untuk controller/DTO yang tipis).
- CI (`ci.yml`): lint → typecheck → unit test → build, jalan di setiap PR sebelum merge ke `main`.

---

## 8. DEPLOYMENT & DEVOPS

### 8.1 Docker Compose (local & production)
```yaml
# docker/docker-compose.yml (local dev)
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: gasela_hris
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    ports: ["3306:3306"]
    volumes: ["mysql-data:/var/lib/mysql"]
  backend:
    build: ../apps/backend
    env_file: ../apps/backend/.env
    ports: ["3001:3001"]
    depends_on: [mysql]
    volumes: ["backend-uploads:/app/uploads"]
  web:
    build: ../apps/web
    env_file: ../apps/web/.env
    ports: ["3000:3000"]
    depends_on: [backend]
volumes:
  mysql-data:
  backend-uploads:
```
Production menambah service `nginx` (reverse proxy + SSL via Certbot) dan memakai `docker-compose.prod.yml` dengan image yang sudah di-build di CI, bukan build-on-server.

### 8.2 CI/CD (GitHub Actions, ringkas)
```yaml
# .github/workflows/deploy.yml
on:
  push: { branches: [main] }
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ghcr.io/org/gasela-backend:${{ github.sha }} apps/backend
      - run: docker push ghcr.io/org/gasela-backend:${{ github.sha }}
      - name: Deploy via SSH
        run: ssh deploy@vps "cd /opt/gasela-hris && docker compose pull && docker compose up -d && docker compose exec backend npx prisma migrate deploy"
```

### 8.3 Checklist kesiapan production
- [ ] `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FCM_SERVER_KEY`, dsb — semua di secrets, tidak di repo
- [ ] Backup otomatis MySQL harian (mysqldump ke storage terpisah/off-site)
- [ ] Domain + SSL (Let's Encrypt via Certbot) untuk API dan web
- [ ] Monitoring dasar: uptime check `/api/health`, log terpusat (mis. simpan ke file + rotate, atau kirim ke layanan log gratis-tier)
- [ ] Storage upload: mulai dari volume Docker lokal → siapkan migrasi ke S3-compatible (R2/MinIO) sebelum jumlah karyawan > 100 atau kapasitas disk jadi masalah
- [ ] Mobile: build production via **EAS Build**, submit ke Play Store (internal testing track dulu untuk 25–50 user)

---

## 9. DOKUMENTASI YANG HARUS DIHASILKAN

1. **README.md** per aplikasi (`backend/`, `web/`, `mobile/`) — cara setup lokal, environment variable, cara run migration & seed
2. **Swagger/OpenAPI** — otomatis dari decorator NestJS, expose di `/api/docs` (dev only, protect/disable di production atau taruh di belakang auth)
3. **Postman Collection** — export dari Swagger (bisa generate otomatis via `swagger2postman` atau import langsung URL `/api/docs-json` ke Postman)
4. **ERD** (`docs/ERD.md`) — generate dari `schema.prisma` pakai `prisma-erd-generator`
5. **RUNBOOK.md** — prosedur operasional: cara generate payroll bulanan, cara restore backup, cara rotate JWT secret

---

## 10. DEFINITION OF DONE PER FASE

**Fase 1 selesai jika:** login berfungsi untuk 5 role, CRUD employee lengkap dengan foto, check-in/out mobile tervalidasi GPS + tersimpan foto, leave request→approval→balance berkurang otomatis, dashboard dasar menampilkan data real dari DB (bukan dummy), seluruh endpoint Fase 1 terdokumentasi di Swagger, unit test kalkulasi attendance ≥70% coverage.

**Fase 2 selesai jika:** payroll 1 bulan penuh bisa digenerate untuk seluruh karyawan aktif dengan BPJS+PPh21 terhitung otomatis, payslip PDF bisa diunduh dari web & mobile, pengumuman terkirim sebagai push notification ke mobile, dashboard executive/HRD/manager menampilkan chart nyata.

**Fase 3 selesai jika:** seluruh modul di prompt awal (performance review, training, asset, document) berfungsi CRUD, export laporan Excel/PDF berjalan, mobile bisa dipakai offline lalu sync otomatis saat online kembali, security checklist Bagian 6 tercentang semua, sudah deploy ke VPS production dan lolos UAT dengan minimal 10 user nyata.

---

## 11. CARA MENJALANKAN PLAN INI DENGAN AI CODING AGENT

Urutan prompt yang disarankan supaya AI agent (mis. di Antigravity/Claude Code) tidak kehilangan konteks arsitektur:

1. **Prompt 1 — Scaffold:** minta agent buat struktur monorepo penuh (Bagian 1) + `schema.prisma` (Bagian 2) + jalankan migration & seed pertama. Verifikasi dulu sebelum lanjut — ini fondasi semua modul berikutnya.
2. **Prompt 2 — Auth module:** minta agent implementasi `auth` + `users` + guard RBAC (Bagian 5.1) lengkap dengan test. Jangan lanjut ke modul lain sebelum login/refresh-token benar-benar jalan dan teruji.
3. **Prompt 3 dst. — satu modul per prompt**, urut sesuai roadmap Bagian 3 (employees → attendance → leave → overtime → payroll → announcement → dashboard). Setiap prompt: minta backend dulu + test, baru lanjut prompt terpisah untuk UI web, lalu prompt terpisah lagi untuk layar mobile — jangan digabung dalam satu prompt besar karena AI agent lebih akurat kalau scope-nya sempit dan bisa diverifikasi bertahap.
4. **Selalu sertakan potongan dokumen ini yang relevan** (skema tabel terkait + kode kunci terkait) sebagai konteks di setiap prompt modul, supaya agent tidak menebak-nebak nama kolom/enum.
5. **Prompt terakhir per fase:** minta agent jalankan semua test, cek coverage, dan buat ringkasan apa yang masih kurang dari Definition of Done (Bagian 10) fase tersebut sebelum kamu lanjut ke fase berikutnya.

---

**Status dokumen:** siap dieksekusi. Tabel `TerRate`, `Holiday`, dan `CompanySetting` adalah penambahan di luar spesifikasi asli — kalau ada alasan bisnis untuk tidak memakainya, itu satu-satunya bagian yang perlu didiskusikan ulang sebelum mulai coding.
