CREATE TABLE `fee_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fee_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sundries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type_id` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sundries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sundries` ADD CONSTRAINT `sundries_type_id_fee_types_id_fk` FOREIGN KEY (`type_id`) REFERENCES `fee_types`(`id`) ON DELETE no action ON UPDATE no action;