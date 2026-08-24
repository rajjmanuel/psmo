ALTER TABLE `activity_logs` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` MODIFY COLUMN `logo_url` text NOT NULL DEFAULT ('https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=400&q=80');--> statement-breakpoint
ALTER TABLE `app_settings` MODIFY COLUMN `hero_image_url` text NOT NULL DEFAULT ('https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85');--> statement-breakpoint
ALTER TABLE `app_settings` MODIFY COLUMN `inventory_image_url` text NOT NULL DEFAULT ('https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1000&q=85');--> statement-breakpoint
ALTER TABLE `app_settings` MODIFY COLUMN `disposal_image_url` text NOT NULL DEFAULT ('https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=85');--> statement-breakpoint
ALTER TABLE `app_settings` MODIFY COLUMN `procurement_image_url` text NOT NULL DEFAULT ('https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85');--> statement-breakpoint
ALTER TABLE `assets` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `canvass_quotes` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `disposal_items` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `disposal_requests` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `disposal_requests` MODIFY COLUMN `endorsed_at` datetime;--> statement-breakpoint
ALTER TABLE `disposal_requests` MODIFY COLUMN `verified_at` datetime;--> statement-breakpoint
ALTER TABLE `disposal_requests` MODIFY COLUMN `approved_at` datetime;--> statement-breakpoint
ALTER TABLE `offices` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `procurement_requests` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `procurement_requests` MODIFY COLUMN `approved_at` datetime;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;