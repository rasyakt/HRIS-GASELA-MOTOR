-- AlterTable
ALTER TABLE `announcements` ADD COLUMN `target_department_id` INTEGER NULL,
    ADD COLUMN `target_employee_id` INTEGER NULL,
    ADD COLUMN `target_position_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `device_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `platform` VARCHAR(20) NOT NULL DEFAULT 'android',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `device_tokens_employee_id_token_key`(`employee_id`, `token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `device_tokens` ADD CONSTRAINT `device_tokens_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE;
