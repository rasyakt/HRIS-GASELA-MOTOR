-- AlterTable users to add Two-Factor Authentication (2FA) support
ALTER TABLE `users`
ADD COLUMN `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `two_factor_secret` TEXT NULL,
ADD COLUMN `two_factor_recovery_codes` TEXT NULL;
