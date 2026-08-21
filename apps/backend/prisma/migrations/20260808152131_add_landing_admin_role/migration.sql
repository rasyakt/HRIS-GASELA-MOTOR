-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('admin', 'hrd', 'manager', 'employee', 'owner', 'landing_admin') NOT NULL;
