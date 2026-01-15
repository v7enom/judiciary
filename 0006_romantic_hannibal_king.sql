CREATE TABLE `case_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`suspectRobloxId` bigint NOT NULL,
	`suspectRobloxUsername` varchar(255) NOT NULL,
	`complainantRobloxId` bigint,
	`complainantRobloxUsername` varchar(255),
	`crimeType` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255),
	`incidentDate` timestamp,
	`evidenceUrls` text,
	`requesterId` int NOT NULL,
	`requesterName` varchar(255) NOT NULL,
	`reviewerId` int,
	`reviewerName` varchar(255),
	`reviewNotes` text,
	`reviewedAt` timestamp,
	`approvedCaseId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `case_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `userRole` enum('admin','judge','investigator','officer','member') NOT NULL;--> statement-breakpoint
CREATE INDEX `status_idx` ON `case_requests` (`status`);--> statement-breakpoint
CREATE INDEX `requester_id_idx` ON `case_requests` (`requesterId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `case_requests` (`createdAt`);