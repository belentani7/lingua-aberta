CREATE TABLE `game_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameId` varchar(32) NOT NULL,
	`language` varchar(32) NOT NULL,
	`courseSlug` varchar(100),
	`totalGames` int NOT NULL DEFAULT 0,
	`totalScore` int NOT NULL DEFAULT 0,
	`totalXp` int NOT NULL DEFAULT 0,
	`bestStreak` int NOT NULL DEFAULT 0,
	`bestScore` int NOT NULL DEFAULT 0,
	`completed` int NOT NULL DEFAULT 0,
	`lastPlayed` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `game_progress_user_game_lang_unique` UNIQUE(`userId`,`gameId`,`language`)
);
--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameId` varchar(32) NOT NULL,
	`language` varchar(32) NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`score` int NOT NULL DEFAULT 0,
	`xpEarned` int NOT NULL DEFAULT 0,
	CONSTRAINT `game_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_words` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wordId` int NOT NULL,
	`topic` varchar(64) NOT NULL,
	`pt` varchar(128) NOT NULL,
	`es` varchar(128) NOT NULL,
	`ca` varchar(128) NOT NULL,
	`en` varchar(128) NOT NULL,
	`phrase` text NOT NULL,
	`hint` text NOT NULL,
	CONSTRAINT `game_words_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learner_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`age` int NOT NULL,
	`nativeLanguage` varchar(16) NOT NULL DEFAULT 'pt-BR',
	`region` varchar(80) NOT NULL DEFAULT 'Cataluña',
	`educationLevel` varchar(80) NOT NULL DEFAULT '3º ESO',
	`cefrLevel` varchar(8) NOT NULL DEFAULT 'A2',
	`goals` text,
	`guardianConsent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learner_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `learning_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`language` varchar(32) NOT NULL,
	`courseSlug` varchar(100) NOT NULL,
	`progressPercent` int NOT NULL DEFAULT 0,
	`completedLessons` int NOT NULL DEFAULT 0,
	`totalLessons` int NOT NULL DEFAULT 8,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tutor_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`detectedLanguage` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tutor_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tutor_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`language` varchar(32) NOT NULL,
	`mode` varchar(32) NOT NULL DEFAULT 'voice',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tutor_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
