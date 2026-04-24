CREATE DATABASE IF NOT EXISTS dontforget_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dontforget_db;

CREATE TABLE `users` (
  `userID` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `googleID` varchar(255) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `bio` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`userID`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `googleID` (`googleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `categoryID` int(11) NOT NULL AUTO_INCREMENT,
  `categoryName` varchar(50) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`categoryID`),
  UNIQUE KEY `categoryName` (`categoryName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_interests` (
  `userID` int(11) NOT NULL,
  `categoryID` int(11) NOT NULL,
  PRIMARY KEY (`userID`,`categoryID`),
  KEY `categoryID` (`categoryID`),
  CONSTRAINT `user_interests_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `user_interests_ibfk_2` FOREIGN KEY (`categoryID`) REFERENCES `categories` (`categoryID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `checklists` (
  `checklistID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `categoryID` int(11) DEFAULT NULL,
  `coverImage` varchar(500) DEFAULT NULL,
  `isPublic` tinyint(1) DEFAULT 0,
  `copyCount` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`checklistID`),
  KEY `userID` (`userID`),
  KEY `categoryID` (`categoryID`),
  CONSTRAINT `checklists_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `checklists_ibfk_2` FOREIGN KEY (`categoryID`) REFERENCES `categories` (`categoryID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `checklist_items` (
  `itemID` int(11) NOT NULL AUTO_INCREMENT,
  `checklistID` int(11) NOT NULL,
  `itemText` varchar(500) NOT NULL,
  `isChecked` tinyint(1) DEFAULT 0,
  `imageURL` varchar(500) DEFAULT NULL,
  `sortOrder` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`itemID`),
  KEY `checklistID` (`checklistID`),
  CONSTRAINT `checklist_items_ibfk_1` FOREIGN KEY (`checklistID`) REFERENCES `checklists` (`checklistID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `checklist_gallery` (
  `imageID` int(11) NOT NULL AUTO_INCREMENT,
  `checklistID` int(11) NOT NULL,
  `imageUrl` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`imageID`),
  KEY `checklistID` (`checklistID`),
  CONSTRAINT `checklist_gallery_ibfk_1` FOREIGN KEY (`checklistID`) REFERENCES `checklists` (`checklistID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `checklist_copies` (
  `copyID` int(11) NOT NULL AUTO_INCREMENT,
  `originalChecklistID` int(11) NOT NULL,
  `copiedByUserID` int(11) NOT NULL,
  `copied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`copyID`),
  KEY `originalChecklistID` (`originalChecklistID`),
  KEY `copiedByUserID` (`copiedByUserID`),
  CONSTRAINT `checklist_copies_ibfk_1` FOREIGN KEY (`originalChecklistID`) REFERENCES `checklists` (`checklistID`) ON DELETE CASCADE,
  CONSTRAINT `checklist_copies_ibfk_2` FOREIGN KEY (`copiedByUserID`) REFERENCES `users` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `places` (
  `placeID` int(11) NOT NULL AUTO_INCREMENT,
  `checklistID` int(11) NOT NULL,
  `itemID` int(11) DEFAULT NULL,
  `placeName` varchar(200) NOT NULL,
  `address` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `placeType` enum('restaurant','cafe','attraction','hotel','other') DEFAULT 'other',
  `googlePlaceID` varchar(255) DEFAULT NULL,
  `imageURL` varchar(500) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`placeID`),
  KEY `checklistID` (`checklistID`),
  KEY `itemID` (`itemID`),
  CONSTRAINT `places_ibfk_1` FOREIGN KEY (`checklistID`) REFERENCES `checklists` (`checklistID`) ON DELETE CASCADE,
  CONSTRAINT `places_ibfk_2` FOREIGN KEY (`itemID`) REFERENCES `checklist_items` (`itemID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`categoryName`, `icon`, `color`) VALUES
('การท่องเที่ยว', '✈️', '#3b82f6'),
('การถ่ายภาพ', '📷', '#8b5cf6'),
('อาหารและเครื่องดื่ม', '🍱', '#ef4444'),
('เดินป่า/แคมป์ปิ้ง', '⛺', '#10b981'),
('กีฬา', '⚽', '#f59e0b'),
('จัดกระเป๋า', '🎒', '#6366f1'),
('ทั่วไป', '📝', '#64748b');