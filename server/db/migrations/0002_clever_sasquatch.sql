CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(255),
	`middle_name` varchar(255),
	`last_name` varchar(255),
	`address` varchar(255),
	`contact` varchar(255),
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
