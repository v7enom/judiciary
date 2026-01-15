CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`details` text,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userRole` enum('admin','judge','investigator','officer','viewer') NOT NULL,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(20) NOT NULL,
	`status` enum('open','investigating','pending_judgment','closed') NOT NULL DEFAULT 'open',
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`crimeType` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`accusedPlayerId` int NOT NULL,
	`accusedPlayerName` varchar(255) NOT NULL,
	`complainantName` varchar(255) NOT NULL,
	`complainantDiscordId` varchar(64),
	`witnesses` text,
	`verdict` enum('pending','guilty','not_guilty') NOT NULL DEFAULT 'pending',
	`punishment` text,
	`createdById` int NOT NULL,
	`closedById` int,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `cases_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `discord_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`botToken` text,
	`guildId` varchar(64),
	`notificationChannelId` varchar(64),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discord_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`type` enum('image','video','document','link','audio') NOT NULL,
	`url` text NOT NULL,
	`fileKey` text,
	`description` text,
	`uploadedById` int NOT NULL,
	`uploadedByName` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`content` text NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(255) NOT NULL,
	`authorRole` enum('admin','judge','investigator','officer','viewer') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`robloxUserId` bigint NOT NULL,
	`robloxUsername` varchar(255) NOT NULL,
	`totalCases` int NOT NULL DEFAULT 0,
	`convictions` int NOT NULL DEFAULT 0,
	`acquittals` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`),
	CONSTRAINT `players_robloxUserId_unique` UNIQUE(`robloxUserId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','judge','investigator','officer','viewer') NOT NULL DEFAULT 'viewer';--> statement-breakpoint
ALTER TABLE `users` ADD `discordId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `discordUsername` varchar(255);--> statement-breakpoint
CREATE INDEX `entity_type_idx` ON `audit_logs` (`entityType`);--> statement-breakpoint
CREATE INDEX `entity_id_idx` ON `audit_logs` (`entityId`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `case_number_idx` ON `cases` (`caseNumber`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `cases` (`status`);--> statement-breakpoint
CREATE INDEX `accused_player_id_idx` ON `cases` (`accusedPlayerId`);--> statement-breakpoint
CREATE INDEX `crime_type_idx` ON `cases` (`crimeType`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `cases` (`createdAt`);--> statement-breakpoint
CREATE INDEX `case_id_idx` ON `evidence` (`caseId`);--> statement-breakpoint
CREATE INDEX `case_id_idx` ON `notes` (`caseId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `notes` (`createdAt`);--> statement-breakpoint
CREATE INDEX `roblox_user_id_idx` ON `players` (`robloxUserId`);--> statement-breakpoint
CREATE INDEX `roblox_username_idx` ON `players` (`robloxUsername`);--> statement-breakpoint
CREATE INDEX `discord_id_idx` ON `users` (`discordId`);