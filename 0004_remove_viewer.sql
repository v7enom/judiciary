ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','judge','investigator','officer','member') NOT NULL DEFAULT 'member';
