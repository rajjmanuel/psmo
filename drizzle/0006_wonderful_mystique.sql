CREATE TABLE `procurement_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`procurement_request_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`mime_type` varchar(150) NOT NULL,
	`data` mediumtext NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `procurement_units` MODIFY COLUMN `name` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `procurement_attachments` ADD CONSTRAINT `procurement_attachments_procurement_request_id_procurement_requests_id_fk` FOREIGN KEY (`procurement_request_id`) REFERENCES `procurement_requests`(`id`) ON DELETE no action ON UPDATE no action;