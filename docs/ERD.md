# ERD — Gasela HRIS

> **Status: Fase 0.** ERD di-generate otomatis dari `apps/backend/prisma/schema.prisma` menggunakan `prisma-erd-generator` (lihat Bagian 9 PROJECT_PLAN). Dokumen ini menjadi output task Fase 0/1.

## Cara generate

```bash
cd apps/backend
npx prisma-erd-generator --schema prisma/schema.prisma
```

## Ringkasan entitas (25 model)

- **Core:** Department, Position, Employee, User, FamilyMember
- **Attendance:** Shift, Attendance
- **Leave:** LeaveType, LeaveBalance, LeaveRequest
- **Overtime:** OvertimeRequest
- **Payroll:** SalaryComponent, Payroll, PayrollComponent, TerRate, CompanySetting, Holiday
- **Announcement:** Announcement, AnnouncementRead
- **Phase 3:** EmployeeDocument, PerformanceReview, TrainingRecord, AssetAssignment

> Diagram lengkap (`prisma/ERD.svg`) ditambahkan setelah task generate di sprint Fase 0.