ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','judge','investigator','officer','member','viewer') NOT NULL DEFAULT 'member';
