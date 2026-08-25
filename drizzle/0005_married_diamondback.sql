CREATE TABLE `procurement_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_units_id` PRIMARY KEY(`id`),
	CONSTRAINT `procurement_units_name_unique` UNIQUE(`name`)
);
