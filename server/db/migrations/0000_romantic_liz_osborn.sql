CREATE TABLE `academicYears` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academic_year` varchar(255) NOT NULL,
	`status` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `academicYears_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fee_name` varchar(100) NOT NULL,
	`fee_description` varchar(255),
	`fee_amount` decimal(10,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gradeLevel` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grade_level_name` varchar(255) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `gradeLevel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`strand_name` varchar(255) NOT NULL,
	`strand_description` varchar(255) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `strands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`middle_name` varchar(255),
	`last_name` varchar(255) NOT NULL,
	`address` varchar(255),
	`contact_number` varchar(255),
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sundries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sundry_name` varchar(100) NOT NULL,
	`sundry_description` text,
	`sundry_amount` decimal(10,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sundries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
