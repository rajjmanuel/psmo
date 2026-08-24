CREATE TABLE `activity_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`module` text NOT NULL,
	`action` text NOT NULL,
	`reference_id` int,
	`details` text,
	`actor` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`org_name` text NOT NULL DEFAULT ('Property Supply and Management Office'),
	`system_title` text NOT NULL DEFAULT ('Asset Management System'),
	`short_name` text NOT NULL DEFAULT ('PSMO'),
	`tagline` text NOT NULL DEFAULT ('Property · Supply'),
	`focal_text` text NOT NULL DEFAULT ('Focal: Ma''am Mitch & PSMO Staff'),
	`hero_subtitle` text NOT NULL DEFAULT ('Official ledger for recording stock, disposing unserviceable property, and walking AMT / SSMT purchases from canvass to Material Receiving Report.'),
	`login_welcome` text NOT NULL DEFAULT ('Use your PSMO credentials. After login you will go straight to dashboard.'),
	`logo_url` text NOT NULL DEFAULT ('/images/seal.png'),
	`hero_image_url` text NOT NULL DEFAULT ('/images/hero.jpg'),
	`inventory_image_url` text NOT NULL DEFAULT ('/images/inventory.jpg'),
	`disposal_image_url` text NOT NULL DEFAULT ('/images/disposal.jpg'),
	`procurement_image_url` text NOT NULL DEFAULT ('/images/procurement.jpg'),
	`theme_preset` text NOT NULL DEFAULT ('blue'),
	`primary_color` text NOT NULL DEFAULT ('#1d4ed8'),
	`primary_deep` text NOT NULL DEFAULT ('#172554'),
	`accent_color` text NOT NULL DEFAULT ('#06b6d4'),
	`paper_color` text NOT NULL DEFAULT ('#f6f8fc'),
	`ink_color` text NOT NULL DEFAULT ('#0f172a'),
	`font_family` text NOT NULL DEFAULT ('Poppins'),
	`font_scale` text NOT NULL DEFAULT ('100'),
	`updated_by` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tagging_no` text NOT NULL,
	`description` text NOT NULL,
	`brand` text,
	`model` text,
	`serial_no` text,
	`parts_no` text,
	`date_of_purchase` date,
	`office_id` int,
	`location_note` text,
	`status` text NOT NULL DEFAULT ('serviceable'),
	`category` text,
	`unit_cost` decimal(14,2),
	`source` text NOT NULL DEFAULT ('office'),
	`condition` text,
	`remarks` text,
	`recorded_by` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assets_tagging_no_unique` UNIQUE(`tagging_no`)
);
--> statement-breakpoint
CREATE TABLE `canvass_quotes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`procurement_request_id` int NOT NULL,
	`supplier` text NOT NULL,
	`quoted_price` decimal(14,2) NOT NULL,
	`terms` text,
	`selected` boolean NOT NULL DEFAULT false,
	`notes` text,
	CONSTRAINT `canvass_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disposal_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`disposal_request_id` int NOT NULL,
	`asset_id` int NOT NULL,
	`reason` text,
	`condition` text,
	CONSTRAINT `disposal_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disposal_requests` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`request_no` text NOT NULL,
	`office_id` int,
	`requested_by` text NOT NULL,
	`request_date` date NOT NULL,
	`status` text NOT NULL DEFAULT ('requested'),
	`endorsement_type` text,
	`endorsement_ref` text,
	`endorsed_by` text,
	`endorsed_at` timestamp,
	`verification` text,
	`verified_by` text,
	`verified_at` timestamp,
	`approved_by` text,
	`approved_at` timestamp,
	`reason` text,
	`remarks` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disposal_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `disposal_requests_request_no_unique` UNIQUE(`request_no`)
);
--> statement-breakpoint
CREATE TABLE `offices` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`head` text,
	`floor` text,
	`contact` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offices_id` PRIMARY KEY(`id`),
	CONSTRAINT `offices_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `procurement_requests` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`request_no` text NOT NULL,
	`unit` text NOT NULL,
	`office_id` int,
	`requested_by` text NOT NULL,
	`request_date` date NOT NULL,
	`item_name` text NOT NULL,
	`specifications` text,
	`quantity` int NOT NULL DEFAULT 1,
	`estimated_cost` decimal(14,2),
	`justification` text,
	`status` text NOT NULL DEFAULT ('requested'),
	`comparative_notes` text,
	`approval_notes` text,
	`approved_by` text,
	`approved_at` timestamp,
	`control_no` text,
	`po_date` date,
	`payment_ref` text,
	`payment_date` date,
	`mrr_no` text,
	`mrr_date` date,
	`mrr_from` text,
	`supplier` text,
	`remarks` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_requests_request_no_unique` UNIQUE(`request_no`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL DEFAULT ('staff'),
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_office_id_offices_id_fk` FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `canvass_quotes` ADD CONSTRAINT `canvass_quotes_procurement_request_id_procurement_requests_id_fk` FOREIGN KEY (`procurement_request_id`) REFERENCES `procurement_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disposal_items` ADD CONSTRAINT `disposal_items_disposal_request_id_disposal_requests_id_fk` FOREIGN KEY (`disposal_request_id`) REFERENCES `disposal_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disposal_items` ADD CONSTRAINT `disposal_items_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disposal_requests` ADD CONSTRAINT `disposal_requests_office_id_offices_id_fk` FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procurement_requests` ADD CONSTRAINT `procurement_requests_office_id_offices_id_fk` FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON DELETE no action ON UPDATE no action;