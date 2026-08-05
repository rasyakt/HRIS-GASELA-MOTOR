-- AlterTable
ALTER TABLE `users` ADD COLUMN `refresh_token_expiry` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `warning_letters` (
    `warning_id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `letter_number` VARCHAR(50) NOT NULL,
    `level` ENUM('SP1', 'SP2', 'SP3') NOT NULL,
    `violation_reason` TEXT NOT NULL,
    `issued_date` DATE NOT NULL,
    `effective_until` DATE NOT NULL,
    `issued_by` INTEGER NULL,
    `document_url` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `warning_letters_letter_number_key`(`letter_number`),
    PRIMARY KEY (`warning_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `employees_employment_status_idx` ON `employees`(`employment_status`);

-- CreateIndex
CREATE INDEX `employees_is_active_idx` ON `employees`(`is_active`);

-- CreateIndex
CREATE INDEX `employees_full_name_idx` ON `employees`(`full_name`);

-- CreateIndex
CREATE INDEX `employees_email_idx` ON `employees`(`email`);

-- CreateIndex
CREATE INDEX `leave_requests_status_idx` ON `leave_requests`(`status`);

-- CreateIndex
CREATE INDEX `leave_requests_start_date_idx` ON `leave_requests`(`start_date`);

-- CreateIndex
CREATE INDEX `leave_requests_end_date_idx` ON `leave_requests`(`end_date`);

-- CreateIndex
CREATE INDEX `overtime_requests_overtime_date_idx` ON `overtime_requests`(`overtime_date`);

-- CreateIndex
CREATE INDEX `overtime_requests_status_idx` ON `overtime_requests`(`status`);

-- CreateIndex
CREATE INDEX `payrolls_employee_id_idx` ON `payrolls`(`employee_id`);

-- CreateIndex
CREATE INDEX `payrolls_month_year_idx` ON `payrolls`(`month`, `year`);

-- CreateIndex
CREATE INDEX `payrolls_status_idx` ON `payrolls`(`status`);

-- AddForeignKey
ALTER TABLE `warning_letters` ADD CONSTRAINT `warning_letters_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warning_letters` ADD CONSTRAINT `warning_letters_issued_by_fkey` FOREIGN KEY (`issued_by`) REFERENCES `employees`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `employees` RENAME INDEX `employees_department_id_fkey` TO `employees_department_id_idx`;

-- RenameIndex
ALTER TABLE `employees` RENAME INDEX `employees_position_id_fkey` TO `employees_position_id_idx`;

-- RenameIndex
ALTER TABLE `employees` RENAME INDEX `employees_reports_to_fkey` TO `employees_reports_to_idx`;

-- RenameIndex
ALTER TABLE `leave_requests` RENAME INDEX `leave_requests_approved_by_fkey` TO `leave_requests_approved_by_idx`;

-- RenameIndex
ALTER TABLE `leave_requests` RENAME INDEX `leave_requests_employee_id_fkey` TO `leave_requests_employee_id_idx`;

-- RenameIndex
ALTER TABLE `leave_requests` RENAME INDEX `leave_requests_leave_type_id_fkey` TO `leave_requests_leave_type_id_idx`;

-- RenameIndex
ALTER TABLE `overtime_requests` RENAME INDEX `overtime_requests_approved_by_fkey` TO `overtime_requests_approved_by_idx`;

-- RenameIndex
ALTER TABLE `overtime_requests` RENAME INDEX `overtime_requests_employee_id_fkey` TO `overtime_requests_employee_id_idx`;

-- RenameIndex
ALTER TABLE `payrolls` RENAME INDEX `payrolls_approved_by_fkey` TO `payrolls_approved_by_idx`;
