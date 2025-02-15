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
    letter_grade VARCHAR(2) NOT NULL,
    numerical_grade DECIMAL(5, 2),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE
);

-- Handle conversion from letter grade to numerical value 
CREATE TABLE IF NOT EXISTS grade_conversion (
    letter_grade VARCHAR(2) PRIMARY KEY,
    numeric_value DECIMAL(5,2)
);

-- GPA Letter to number conversions 
INSERT INTO grade_conversion (letter_grade, numeric_value) VALUES
('A', 4.00), ('A-', 3.67), ('B+', 3.33), ('B', 3.00), ('B-', 2.67),
('C+', 2.33), ('C', 2.00), ('C-', 1.67), ('D+', 1.33), ('D', 1.00), ('D-', 0.67),
('F', 0.00), ('I', NULL), ('W', NULL), ('P', NULL), ('NP', NULL);



-- TRIGGERS
-- -------------------------------------------------------------------------------------------

DELIMITER $$

-- BEFORE INSERT Trigger to set numerical_grade before inserting a new grade
CREATE TRIGGER before_grade_insert
BEFORE INSERT ON grades
FOR EACH ROW
BEGIN
    SET NEW.numerical_grade = (
        SELECT numeric_value FROM grade_conversion 
        WHERE letter_grade = NEW.letter_grade
    );
END$$

-- BEFORE UPDATE Trigger to set numerical_grade before updating an existing grade
CREATE TRIGGER before_grade_update
BEFORE UPDATE ON grades
FOR EACH ROW
BEGIN
    SET NEW.numerical_grade = (
        SELECT numeric_value FROM grade_conversion 
        WHERE letter_grade = NEW.letter_grade
    );
END$$

DELIMITER ;

DELIMITER $$

-- Recalculate class GPA after a grade is inserted or updated
CREATE TRIGGER after_grade_insert_update
AFTER INSERT ON grades
FOR EACH ROW
BEGIN
    -- Recalculate Class GPA
    UPDATE classes
    SET average_gpa = (
        SELECT AVG(numerical_grade)
        FROM grades
        WHERE class_id = NEW.class_id AND numerical_grade IS NOT NULL
    )
    WHERE class_id = NEW.class_id;

    -- Recalculate Student Cumulative GPA
    UPDATE students
    SET cumulative_gpa = (
        SELECT SUM(numerical_grade * credit_hours) / SUM(credit_hours)
        FROM grades g
        JOIN classes c ON g.class_id = c.class_id
        WHERE g.student_id = NEW.student_id AND numerical_grade IS NOT NULL
    )
    WHERE student_id = NEW.student_id;

    -- Recalculate Group GPA
    SET @group_gpa = (
        SELECT AVG(numerical_grade)
        FROM grades g
        JOIN classes c ON g.class_id = c.class_id
        JOIN class_group_mapping cgm ON cgm.class_id = c.class_id
        WHERE cgm.group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id)
        AND numerical_grade IS NOT NULL
    );

    UPDATE `groups`
    SET group_gpa = @group_gpa
    WHERE group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id);
END$$

-- Recalculate class GPA after a grade is deleted
CREATE TRIGGER after_grade_delete
AFTER DELETE ON grades
FOR EACH ROW
BEGIN
    -- Recalculate Class GPA
    UPDATE classes
    SET average_gpa = (
        SELECT AVG(numerical_grade)
        FROM grades
        WHERE class_id = OLD.class_id AND numerical_grade IS NOT NULL
    )
    WHERE class_id = OLD.class_id;

    -- Recalculate Student Cumulative GPA
    UPDATE students
    SET cumulative_gpa = (
        SELECT SUM(numerical_grade * credit_hours) / SUM(credit_hours)
        FROM grades g
        JOIN classes c ON g.class_id = c.class_id
        WHERE g.student_id = OLD.student_id AND numerical_grade IS NOT NULL
    )
    WHERE student_id = OLD.student_id;

    -- Recalculate Group GPA
    SET @group_gpa = (
        SELECT AVG(numerical_grade)
        FROM grades g
        JOIN classes c ON g.class_id = c.class_id
        JOIN class_group_mapping cgm ON cgm.class_id = c.class_id
        WHERE cgm.group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = OLD.class_id)
        AND numerical_grade IS NOT NULL
    );

    UPDATE `groups`
    SET group_gpa = @group_gpa
    WHERE group_id = (SELECT group_id FROM class_group_mapping WHERE class_id = OLD.class_id);
END$$

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

-- Insert Grades (student_id, class_id, grade as letter)
INSERT INTO grades (student_id, class_id, letter_grade) VALUES
    ('S001', 1, 'A'),   -- 4.00
    ('S002', 1, 'A-'),  -- 3.67
    ('S003', 1, 'B+'),  -- 3.33
    ('S004', 1, 'B'),   -- 3.00
    ('S005', 1, 'B-'),  -- 2.67
    ('S001', 2, 'C+'),  -- 2.33
    ('S002', 2, 'C'),   -- 2.00
    ('S003', 2, 'C-'),  -- 1.67
    ('S004', 2, 'D+'),  -- 1.33
    ('S005', 2, 'D'),   -- 1.00
    ('S001', 3, 'D-'),  -- 0.67
    ('S002', 3, 'F'),   -- 0.00
    ('S003', 3, 'I'),   -- Incomplete (ignored in GPA)
    ('S004', 3, 'W'),   -- Withdrawn (ignored in GPA)
    ('S005', 3, 'P');   -- Pass (ignored in GPA)

