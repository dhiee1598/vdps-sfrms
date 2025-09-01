ALTER TABLE `students` MODIFY COLUMN `first_name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `last_name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `contact_number` varchar(255);--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `contact`;