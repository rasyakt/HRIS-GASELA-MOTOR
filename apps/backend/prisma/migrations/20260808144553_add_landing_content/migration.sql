-- CreateTable
CREATE TABLE `landing_contents` (
    `content_id` INTEGER NOT NULL AUTO_INCREMENT,
    `section_key` VARCHAR(50) NOT NULL,
    `content_json` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `landing_contents_section_key_key`(`section_key`),
    PRIMARY KEY (`content_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
