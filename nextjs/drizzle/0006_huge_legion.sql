CREATE TABLE `role_permission` (
	`id` text PRIMARY KEY NOT NULL,
	`role_name` text NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
