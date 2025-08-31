CREATE TABLE `course` (
	`id` int AUTO_INCREMENT NOT NULL,
	`course_name` varchar(255) NOT NULL,
	`course_description` varchar(255) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `course_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `yearLevel` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `yearLevel_id` PRIMARY KEY(`id`)
);
