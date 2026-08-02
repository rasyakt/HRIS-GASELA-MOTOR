-- CreateTable
CREATE TABLE `departments` (
    `department_id` INTEGER NOT NULL AUTO_INCREMENT,
    `department_code` VARCHAR(10) NOT NULL,
    `department_name` VARCHAR(100) NOT NULL,
    `parent_department_id` INTEGER NULL,
    `head_of_department` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `departments_department_code_key`(`department_code`),
    PRIMARY KEY (`department_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positions` (
    `position_id` INTEGER NOT NULL AUTO_INCREMENT,
    `position_code` VARCHAR(10) NOT NULL,
    `position_name` VARCHAR(100) NOT NULL,
    `job_description` TEXT NULL,
    `level` INTEGER NULL,
    `min_salary` DECIMAL(15, 2) NULL,
    `max_salary` DECIMAL(15, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `positions_position_code_key`(`position_code`),
    PRIMARY KEY (`position_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `employee_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_number` VARCHAR(20) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `birth_date` DATE NULL,
    `id_card_number` VARCHAR(20) NULL,
    `tax_number` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `emergency_contact_name` VARCHAR(100) NULL,
    `emergency_contact_phone` VARCHAR(20) NULL,
    `department_id` INTEGER NULL,
    `position_id` INTEGER NULL,
    `reports_to` INTEGER NULL,
    `join_date` DATE NOT NULL,
    `permanent_date` DATE NULL,
    `resign_date` DATE NULL,
    `employment_status` ENUM('active', 'probation', 'resigned', 'terminated') NOT NULL DEFAULT 'probation',
    `employment_type` ENUM('permanent', 'contract', 'magang') NOT NULL,
    `basic_salary` DECIMAL(15, 2) NOT NULL,
    `bank_account_name` VARCHAR(100) NULL,
    `bank_account_number` VARCHAR(30) NULL,
    `bank_name` VARCHAR(50) NULL,
    `profile_photo_url` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_employee_number_key`(`employee_number`),
    UNIQUE INDEX `employees_email_key`(`email`),
    UNIQUE INDEX `employees_id_card_number_key`(`id_card_number`),
    PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_members` (
    `family_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `relationship` ENUM('spouse', 'child', 'parent', 'sibling') NOT NULL,
    `id_card_number` VARCHAR(20) NULL,
    `birth_date` DATE NULL,
    `gender` ENUM('male', 'female') NULL,
    `is_bpjs_dependent` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`family_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'hrd', 'manager', 'employee', 'owner') NOT NULL,
    `refresh_token_hash` VARCHAR(255) NULL,
    `last_login` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_employee_id_key`(`employee_id`),
    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shifts` (
    `shift_id` INTEGER NOT NULL AUTO_INCREMENT,
    `shift_name` VARCHAR(50) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `grace_period_minutes` INTEGER NOT NULL DEFAULT 15,
    `work_hours` DECIMAL(5, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`shift_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `attendance_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `attendance_date` DATE NOT NULL,
    `check_in_time` TIME NULL,
    `check_out_time` TIME NULL,
    `check_in_lat` DECIMAL(10, 7) NULL,
    `check_in_lng` DECIMAL(10, 7) NULL,
    `check_out_lat` DECIMAL(10, 7) NULL,
    `check_out_lng` DECIMAL(10, 7) NULL,
    `shift_id` INTEGER NULL,
    `status` ENUM('present', 'late', 'early_leave', 'absent', 'leave', 'holiday') NOT NULL DEFAULT 'present',
    `late_minutes` INTEGER NOT NULL DEFAULT 0,
    `early_leave_minutes` INTEGER NOT NULL DEFAULT 0,
    `work_hours` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `check_in_photo_url` VARCHAR(255) NULL,
    `check_out_photo_url` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attendances_employee_id_attendance_date_idx`(`employee_id`, `attendance_date`),
    UNIQUE INDEX `attendances_employee_id_attendance_date_key`(`employee_id`, `attendance_date`),
    PRIMARY KEY (`attendance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_types` (
    `leave_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `leave_type_code` VARCHAR(10) NOT NULL,
    `leave_type_name` VARCHAR(50) NOT NULL,
    `annual_quota` INTEGER NOT NULL,
    `is_paid` BOOLEAN NOT NULL DEFAULT true,
    `requires_document` BOOLEAN NOT NULL DEFAULT false,
    `max_consecutive_days` INTEGER NULL,
    `min_notice_days` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `leave_types_leave_type_code_key`(`leave_type_code`),
    PRIMARY KEY (`leave_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_balances` (
    `balance_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `leave_type_id` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `quota` INTEGER NOT NULL,
    `used` INTEGER NOT NULL DEFAULT 0,
    `remaining` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `leave_balances_employee_id_leave_type_id_year_key`(`employee_id`, `leave_type_id`, `year`),
    PRIMARY KEY (`balance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `leave_request_id` INTEGER NOT NULL AUTO_INCREMENT,
    `request_number` VARCHAR(30) NOT NULL,
    `employee_id` INTEGER NOT NULL,
    `leave_type_id` INTEGER NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `total_days` INTEGER NOT NULL,
    `reason` TEXT NULL,
    `document_url` VARCHAR(255) NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `leave_requests_request_number_key`(`request_number`),
    PRIMARY KEY (`leave_request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `overtime_requests` (
    `overtime_id` INTEGER NOT NULL AUTO_INCREMENT,
    `request_number` VARCHAR(30) NOT NULL,
    `employee_id` INTEGER NOT NULL,
    `overtime_date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `hours` DECIMAL(5, 2) NOT NULL,
    `purpose` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `overtime_requests_request_number_key`(`request_number`),
    PRIMARY KEY (`overtime_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_components` (
    `salary_component_id` INTEGER NOT NULL AUTO_INCREMENT,
    `component_code` VARCHAR(10) NOT NULL,
    `component_name` VARCHAR(100) NOT NULL,
    `type` ENUM('allowance', 'deduction') NOT NULL,
    `calculation_type` ENUM('fixed', 'percentage', 'formula') NOT NULL,
    `default_amount` DECIMAL(15, 2) NULL,
    `is_taxable` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `salary_components_component_code_key`(`component_code`),
    PRIMARY KEY (`salary_component_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrolls` (
    `payroll_id` INTEGER NOT NULL AUTO_INCREMENT,
    `payroll_number` VARCHAR(30) NOT NULL,
    `employee_id` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `basic_salary` DECIMAL(15, 2) NOT NULL,
    `total_allowance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_deduction` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `overtime_pay` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `gross_salary` DECIMAL(15, 2) NOT NULL,
    `bpjs_kesehatan_employee` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `bpjs_kesehatan_company` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `bpjs_ketenagakerjaan_employee` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `bpjs_ketenagakerjaan_company` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tax_pph21` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `net_salary` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('draft', 'pending_approval', 'approved', 'paid') NOT NULL DEFAULT 'draft',
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `payment_date` DATE NULL,
    `payslip_url` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payrolls_payroll_number_key`(`payroll_number`),
    UNIQUE INDEX `payrolls_employee_id_month_year_key`(`employee_id`, `month`, `year`),
    PRIMARY KEY (`payroll_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_components` (
    `component_id` INTEGER NOT NULL AUTO_INCREMENT,
    `payroll_id` INTEGER NOT NULL,
    `salary_component_id` INTEGER NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `type` ENUM('allowance', 'deduction') NOT NULL,

    PRIMARY KEY (`component_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ter_rates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` ENUM('A', 'B', 'C') NOT NULL,
    `income_from` DECIMAL(15, 2) NOT NULL,
    `income_to` DECIMAL(15, 2) NULL,
    `rate_percent` DECIMAL(5, 2) NOT NULL,

    INDEX `ter_rates_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holidays` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `is_recurring_yearly` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `holidays_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `description` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `company_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcements` (
    `announcement_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    `target_audience` ENUM('all', 'department', 'position', 'specific') NOT NULL DEFAULT 'all',
    `publish_date` DATE NOT NULL,
    `expiry_date` DATE NULL,
    `created_by` INTEGER NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`announcement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcement_reads` (
    `read_id` INTEGER NOT NULL AUTO_INCREMENT,
    `announcement_id` INTEGER NOT NULL,
    `employee_id` INTEGER NOT NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `announcement_reads_announcement_id_employee_id_key`(`announcement_id`, `employee_id`),
    PRIMARY KEY (`read_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_documents` (
    `document_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `document_type` ENUM('ktp', 'npwp', 'ijazah', 'sertifikat', 'kontrak', 'skck', 'cv', 'other') NOT NULL,
    `document_name` VARCHAR(200) NOT NULL,
    `document_url` VARCHAR(255) NOT NULL,
    `upload_date` DATE NOT NULL,
    `expiry_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_reviews` (
    `review_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `reviewer_id` INTEGER NOT NULL,
    `period_month` INTEGER NOT NULL,
    `period_year` INTEGER NOT NULL,
    `review_date` DATE NOT NULL,
    `overall_score` DECIMAL(5, 2) NULL,
    `strengths` TEXT NULL,
    `areas_for_improvement` TEXT NULL,
    `goals_next_period` TEXT NULL,
    `status` ENUM('draft', 'submitted', 'completed') NOT NULL DEFAULT 'draft',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`review_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_records` (
    `training_record_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `training_name` VARCHAR(200) NOT NULL,
    `training_provider` VARCHAR(200) NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `duration_hours` INTEGER NULL,
    `certificate_url` VARCHAR(255) NULL,
    `cost` DECIMAL(15, 2) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`training_record_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_assignments` (
    `assignment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `asset_name` VARCHAR(100) NOT NULL,
    `asset_code` VARCHAR(50) NOT NULL,
    `serial_number` VARCHAR(100) NULL,
    `assignment_date` DATE NOT NULL,
    `return_date` DATE NULL,
    `status` ENUM('assigned', 'returned') NOT NULL DEFAULT 'assigned',
    `condition_notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `asset_assignments_asset_code_key`(`asset_code`),
    PRIMARY KEY (`assignment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_parent_department_id_fkey` FOREIGN KEY (`parent_department_id`) REFERENCES `departments`(`department_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_head_of_department_fkey` FOREIGN KEY (`head_of_department`) REFERENCES `employees`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_position_id_fkey` FOREIGN KEY (`position_id`) REFERENCES `positions`(`position_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_reports_to_fkey` FOREIGN KEY (`reports_to`) REFERENCES `employees`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`shift_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `employees`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `overtime_requests` ADD CONSTRAINT `overtime_requests_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `overtime_requests` ADD CONSTRAINT `overtime_requests_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `employees`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `employees`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_components` ADD CONSTRAINT `payroll_components_payroll_id_fkey` FOREIGN KEY (`payroll_id`) REFERENCES `payrolls`(`payroll_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_components` ADD CONSTRAINT `payroll_components_salary_component_id_fkey` FOREIGN KEY (`salary_component_id`) REFERENCES `salary_components`(`salary_component_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_reads` ADD CONSTRAINT `announcement_reads_announcement_id_fkey` FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`announcement_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_reads` ADD CONSTRAINT `announcement_reads_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_documents` ADD CONSTRAINT `employee_documents_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_records` ADD CONSTRAINT `training_records_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_assignments` ADD CONSTRAINT `asset_assignments_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
