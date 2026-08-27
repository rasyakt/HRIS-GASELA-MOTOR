-- Add security features to User table
ALTER TABLE `users` 
ADD COLUMN `failed_login_attempts` INT NOT NULL DEFAULT 0 AFTER `last_login`,
ADD COLUMN `locked_until` DATETIME NULL AFTER `failed_login_attempts`,
ADD COLUMN `jwt_version` INT NOT NULL DEFAULT 0 AFTER `locked_until`,
ADD COLUMN `password_changed_at` DATETIME NULL AFTER `jwt_version`;

-- Add indexes for performance
CREATE INDEX `idx_users_locked_until` ON `users`(`locked_until`);
CREATE INDEX `idx_users_jwt_version` ON `users`(`jwt_version`);

-- Add index to audit_logs for better query performance
CREATE INDEX `idx_audit_logs_action_timestamp` ON `audit_logs`(`action`, `timestamp`);
CREATE INDEX `idx_audit_logs_user_id` ON `audit_logs`(`user_id`);
CREATE INDEX `idx_audit_logs_resource` ON `audit_logs`(`resource`);
