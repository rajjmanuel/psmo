CREATE TABLE `setting_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mime_type` text NOT NULL,
	`data` mediumtext NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `setting_images_id` PRIMARY KEY(`id`)
);
