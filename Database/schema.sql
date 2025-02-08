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
    class_name VARCHAR(255) NOT NULL,
    average_gpa DECIMAL(5,2) DEFAULT NULL
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

-- Trigger to update average GPA after a new grade is inserted
DELIMITER $$

CREATE TRIGGER update_average_gpa_after_insert
AFTER INSERT ON grades
FOR EACH ROW
BEGIN
    DECLARE new_average DECIMAL(5,2);

    -- Calculate the new average GPA for the class
    SELECT AVG(grade) INTO new_average
    FROM grades
    WHERE class_id = NEW.class_id;

    -- Update the average_gpa column in the classes table
    UPDATE classes
    SET average_gpa = new_average
    WHERE class_id = NEW.class_id;
END $$

DELIMITER ;

-- Trigger to update average GPA after a grade is updated
DELIMITER $$

CREATE TRIGGER update_average_gpa_after_update
AFTER UPDATE ON grades
FOR EACH ROW
BEGIN
    DECLARE new_average DECIMAL(5,2);

    -- Calculate the new average GPA for the class
    SELECT AVG(grade) INTO new_average
    FROM grades
    WHERE class_id = NEW.class_id;

    -- Update the average_gpa column in the classes table
    UPDATE classes
    SET average_gpa = new_average
    WHERE class_id = NEW.class_id;
END $$

DELIMITER ;

-- Trigger to update average GPA after a grade is deleted
DELIMITER $$

CREATE TRIGGER update_average_gpa_after_delete
AFTER DELETE ON grades
FOR EACH ROW
BEGIN
    DECLARE new_average DECIMAL(5,2);

    -- Calculate the new average GPA for the class
    SELECT AVG(grade) INTO new_average
    FROM grades
    WHERE class_id = OLD.class_id;

    -- Update the average_gpa column in the classes table
    UPDATE classes
    SET average_gpa = new_average
    WHERE class_id = OLD.class_id;
END $$

DELIMITER ;

