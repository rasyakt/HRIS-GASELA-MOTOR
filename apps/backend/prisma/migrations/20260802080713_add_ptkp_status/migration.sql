-- AlterTable
ALTER TABLE `employees` ADD COLUMN `ptkp_status` ENUM('TK0', 'TK1', 'TK2', 'TK3', 'K0', 'K1', 'K2', 'K3') NOT NULL DEFAULT 'K2';
