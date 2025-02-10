-- DATABASE SCHEMA
-- May need to be updated to reflect the data that Rucco shares

CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cumulative_gpa DECIMAL(5, 2) DEFAULT 0.00
);

-- Classes Table (Each class is a session)
CREATE TABLE IF NOT EXISTS classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL,
    credit_hours INT NOT NULL DEFAULT 3,
    average_gpa DECIMAL(5,2) DEFAULT NULL
);

-- Groups Table (Collection of classes)
CREATE TABLE IF NOT EXISTS `groups` (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    group_gpa DECIMAL(5, 2) DEFAULT NULL
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


-- DELIMITERS FOR AUTO GPA CALCULATIONS FOR SESSIONS (CLASSES)
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


-- DELIMITERS FOR STUDENT AUTO GRADE CALCULATIONS
-- This does encorperate calculations using credit_hours
-- Update when a new grade is entered
DELIMITER $$

CREATE TRIGGER update_cumulative_gpa_after_insert
AFTER INSERT ON grades
FOR EACH ROW
BEGIN
    DECLARE new_gpa DECIMAL(5, 2);

    -- Calculate the new GPA for the student
    SELECT SUM(g.grade * c.credit_hours) / SUM(c.credit_hours)
    INTO new_gpa
    FROM grades g
    JOIN classes c ON g.class_id = c.class_id
    WHERE g.student_id = NEW.student_id;

    -- Update the cumulative GPA for the student
    UPDATE students
    SET cumulative_gpa = new_gpa
    WHERE student_id = NEW.student_id;
END $$

DELIMITER ;

-- Update when a grade is updated 
DELIMITER $$

CREATE TRIGGER update_cumulative_gpa_after_update
AFTER UPDATE ON grades
FOR EACH ROW
BEGIN
    DECLARE new_gpa DECIMAL(5, 2);

    -- Recalculate the new GPA for the student
    SELECT SUM(g.grade * c.credit_hours) / SUM(c.credit_hours)
    INTO new_gpa
    FROM grades g
    JOIN classes c ON g.class_id = c.class_id
    WHERE g.student_id = NEW.student_id;

    -- Update the cumulative GPA for the student
    UPDATE students
    SET cumulative_gpa = new_gpa
    WHERE student_id = NEW.student_id;
END $$

DELIMITER ;

-- Update after a grade has been deleted
DELIMITER $$

CREATE TRIGGER update_cumulative_gpa_after_delete
AFTER DELETE ON grades
FOR EACH ROW
BEGIN
    DECLARE new_gpa DECIMAL(5, 2);

    -- Recalculate the new GPA for the student
    SELECT SUM(g.grade * c.credit_hours) / SUM(c.credit_hours)
    INTO new_gpa
    FROM grades g
    JOIN classes c ON g.class_id = c.class_id
    WHERE g.student_id = OLD.student_id;

    -- Update the cumulative GPA for the student
    UPDATE students
    SET cumulative_gpa = new_gpa
    WHERE student_id = OLD.student_id;
END $$

DELIMITER ;


-- DELIMITERS FOR GROUP GPA CALCULATIONS
-- Trigger to update group GPA after a class GPA is updated
DELIMITER $$

CREATE TRIGGER update_group_gpa_after_class_gpa_update
AFTER UPDATE ON classes
FOR EACH ROW
BEGIN
    DECLARE new_group_gpa DECIMAL(5, 2);

    -- Calculate the new weighted GPA for the group
    SELECT SUM(c.average_gpa * c.credit_hours) / SUM(c.credit_hours)
    INTO new_group_gpa
    FROM classes c
    JOIN class_group_mapping cgm ON c.class_id = cgm.class_id
    WHERE cgm.group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id);

    -- Update the group GPA
    UPDATE `groups`
    SET group_gpa = new_group_gpa
    WHERE group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id);
END $$

DELIMITER ;

-- Trigger to update group GPA after a grade is inserted, which may affect class GPA
DELIMITER $$

CREATE TRIGGER update_group_gpa_after_grade_insert
AFTER INSERT ON grades
FOR EACH ROW
BEGIN
    DECLARE new_group_gpa DECIMAL(5, 2);

    -- Calculate the new weighted GPA for the group
    SELECT SUM(c.average_gpa * c.credit_hours) / SUM(c.credit_hours)
    INTO new_group_gpa
    FROM classes c
    JOIN class_group_mapping cgm ON c.class_id = cgm.class_id
    WHERE cgm.group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id);

    -- Update the group GPA
    UPDATE `groups`
    SET group_gpa = new_group_gpa
    WHERE group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id);
END $$

DELIMITER ;

-- Trigger to update group GPA after a grade is updated, which may affect class GPA
DELIMITER $$

CREATE TRIGGER update_group_gpa_after_grade_update
AFTER UPDATE ON grades
FOR EACH ROW
BEGIN
    DECLARE new_group_gpa DECIMAL(5, 2);

    -- Calculate the new weighted GPA for the group
    SELECT SUM(c.average_gpa * c.credit_hours) / SUM(c.credit_hours)
    INTO new_group_gpa
    FROM classes c
    JOIN class_group_mapping cgm ON c.class_id = cgm.class_id
    WHERE cgm.group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id);

    -- Update the group GPA
    UPDATE `groups`
    SET group_gpa = new_group_gpa
    WHERE group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id);
END $$

DELIMITER ;

-- Trigger to update group GPA after a grade is deleted, which may affect class GPA
DELIMITER $$

CREATE TRIGGER update_group_gpa_after_grade_delete
AFTER DELETE ON grades
FOR EACH ROW
BEGIN
    DECLARE new_group_gpa DECIMAL(5, 2);

    -- Calculate the new weighted GPA for the group
    SELECT SUM(c.average_gpa * c.credit_hours) / SUM(c.credit_hours)
    INTO new_group_gpa
    FROM classes c
    JOIN class_group_mapping cgm ON c.class_id = cgm.class_id
    WHERE cgm.group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = OLD.class_id);

    -- Update the group GPA
    UPDATE `groups`
    SET group_gpa = new_group_gpa
    WHERE group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = OLD.class_id);
END $$

DELIMITER ;


-- Trigger to update group GPA when a class is added to the group
DELIMITER $$

CREATE TRIGGER update_group_gpa_after_class_added
AFTER INSERT ON class_group_mapping
FOR EACH ROW
BEGIN
    DECLARE new_group_gpa DECIMAL(5, 2);

    -- Calculate the new weighted GPA for the group
    SELECT SUM(c.average_gpa * c.credit_hours) / SUM(c.credit_hours)
    INTO new_group_gpa
    FROM classes c
    JOIN class_group_mapping cgm ON c.class_id = cgm.class_id
    WHERE cgm.group_id = NEW.group_id;

    -- Update the group GPA
    UPDATE `groups`
    SET group_gpa = new_group_gpa
    WHERE group_id = NEW.group_id;
END $$

DELIMITER ;


-- Test Data (Students, Classes, Grades)

-- Insert Students
INSERT INTO students (student_id, first_name, last_name) VALUES
    ('S001', 'John', 'Doe'),
    ('S002', 'Jane', 'Smith'),
    ('S003', 'Michael', 'Johnson'),
    ('S004', 'Emily', 'Davis'),
    ('S005', 'Chris', 'Brown');

-- Insert Classes
INSERT INTO classes (class_name, credit_hours) VALUES
    ('Math 101', 3),
    ('History 101', 3),
    ('Computer Science 101', 4);

-- Insert Groups
INSERT INTO `groups` (group_name) VALUES
    ('Group A'),
    ('Group B');

-- Insert Class-Group Mappings
INSERT INTO class_group_mapping (class_id, group_id) VALUES
    (1, 1),  -- Math 101 -> Group A
    (2, 1),  -- History 101 -> Group A
    (3, 2);  -- Computer Science 101 -> Group B

-- Insert Grades (student_id, class_id, grade)
INSERT INTO grades (student_id, class_id, grade) VALUES
    ('S001', 1, 3.5),
    ('S002', 1, 3.7),
    ('S003', 1, 3.9),
    ('S004', 1, 3.6),
    ('S005', 1, 4.0),
    ('S001', 2, 2.0),
    ('S002', 2, 3.1),
    ('S003', 2, 1.6),
    ('S004', 2, 4.0),
    ('S005', 2, 2.0);

