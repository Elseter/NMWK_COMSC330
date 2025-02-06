-- DATABASE SCHEMA
-- May need to be updated to reflect the data that Rucco shares

CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL
);

-- Classes Table (Each class is a session)
CREATE TABLE IF NOT EXISTS classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL
);

-- Groups Table (Collection of classes)
CREATE TABLE IF NOT EXISTS `groups` (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL
);

-- Mapping Table for Class-Group Relationship
CREATE TABLE IF NOT EXISTS class_group_mapping (
    class_id INT,
    group_id INT,
    PRIMARY KEY (class_id, group_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id) ON DELETE CASCADE
);

-- Grades Table (Ties students to class sessions with their grades)
CREATE TABLE IF NOT EXISTS grades (
    grade_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50),
    class_id INT,
    grade DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE
);

