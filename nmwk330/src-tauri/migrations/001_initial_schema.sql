-- Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    cumulative_gpa REAL DEFAULT 0.00
);

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
    class_id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL,
    credit_hours INTEGER NOT NULL DEFAULT 3,
    average_gpa REAL DEFAULT NULL
);

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
    group_id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name TEXT NOT NULL,
    group_gpa REAL DEFAULT NULL
);

-- Mapping Table for Class-Group Relationship
CREATE TABLE IF NOT EXISTS class_group_mapping (
    class_id INTEGER,
    group_id INTEGER,
    PRIMARY KEY (class_id, group_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE
);

-- Grades Table
CREATE TABLE IF NOT EXISTS grades (
    grade_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    class_id INTEGER,
    letter_grade TEXT NOT NULL,
    numerical_grade REAL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE
);

-- Grade Conversion Table
CREATE TABLE IF NOT EXISTS grade_conversion (
    letter_grade TEXT PRIMARY KEY,
    numeric_value REAL
);

-- Insert Grade Conversion Values
INSERT INTO grade_conversion (letter_grade, numeric_value) VALUES
('A', 4.00), ('A-', 3.67), ('B+', 3.33), ('B', 3.00), ('B-', 2.67),
('C+', 2.33), ('C', 2.00), ('C-', 1.67), ('D+', 1.33), ('D', 1.00), ('D-', 0.67),
('F', 0.00), ('I', NULL), ('W', NULL), ('P', NULL), ('NP', NULL);

-- Create Triggers for Automatic Grade Calculation

-- Trigger to set numerical_grade before inserting a new grade
CREATE TRIGGER before_grade_insert
BEFORE INSERT ON grades
FOR EACH ROW
BEGIN
    SELECT numeric_value INTO NEW.numerical_grade FROM grade_conversion WHERE letter_grade = NEW.letter_grade;
END;

-- Trigger to set numerical_grade before updating an existing grade
CREATE TRIGGER before_grade_update
BEFORE UPDATE ON grades
FOR EACH ROW
BEGIN
    SELECT numeric_value INTO NEW.numerical_grade FROM grade_conversion WHERE letter_grade = NEW.letter_grade;
END;

-- Trigger to update class GPA, student GPA, and group GPA after grade insert/update
CREATE TRIGGER after_grade_insert_update
AFTER INSERT OR UPDATE ON grades
FOR EACH ROW
BEGIN
    -- Update Class GPA
    UPDATE classes 
    SET average_gpa = (SELECT AVG(numerical_grade) FROM grades WHERE class_id = NEW.class_id AND numerical_grade IS NOT NULL)
    WHERE class_id = NEW.class_id;
    
    -- Update Student Cumulative GPA
    UPDATE students
    SET cumulative_gpa = (SELECT SUM(g.numerical_grade * c.credit_hours) / SUM(c.credit_hours)
        FROM grades g
        JOIN classes c ON g.class_id = c.class_id
        WHERE g.student_id = NEW.student_id AND g.numerical_grade IS NOT NULL)
    WHERE student_id = NEW.student_id;
    
    -- Update Group GPAs
    UPDATE groups
    SET group_gpa = (SELECT AVG(g.numerical_grade)
        FROM grades g
        JOIN class_group_mapping cgm ON g.class_id = cgm.class_id
        WHERE cgm.group_id IN (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id)
        AND g.numerical_grade IS NOT NULL)
    WHERE group_id IN (SELECT group_id FROM class_group_mapping WHERE class_id = NEW.class_id);
END;

-- Trigger to update class GPA, student GPA, and group GPA after grade deletion
CREATE TRIGGER after_grade_delete
AFTER DELETE ON grades
FOR EACH ROW
BEGIN
    -- Update Class GPA
    UPDATE classes 
    SET average_gpa = (SELECT AVG(numerical_grade) FROM grades WHERE class_id = OLD.class_id AND numerical_grade IS NOT NULL)
    WHERE class_id = OLD.class_id;
    
    -- Update Student Cumulative GPA
    UPDATE students
    SET cumulative_gpa = (SELECT SUM(g.numerical_grade * c.credit_hours) / SUM(c.credit_hours)
        FROM grades g
        JOIN classes c ON g.class_id = c.class_id
        WHERE g.student_id = OLD.student_id AND g.numerical_grade IS NOT NULL)
    WHERE student_id = OLD.student_id;
    
    -- Update Group GPAs
    UPDATE groups
    SET group_gpa = (SELECT AVG(g.numerical_grade)
        FROM grades g
        JOIN class_group_mapping cgm ON g.class_id = cgm.class_id
        WHERE cgm.group_id IN (SELECT group_id FROM class_group_mapping WHERE class_id = OLD.class_id)
        AND g.numerical_grade IS NOT NULL)
    WHERE group_id IN (SELECT group_id FROM class_group_mapping WHERE class_id = OLD.class_id);
END;

-- Test Data for Initial Setup
INSERT INTO students (student_id, first_name, last_name) VALUES
    ('S001', 'John', 'Doe'),
    ('S002', 'Jane', 'Smith'),
    ('S003', 'Michael', 'Johnson'),
    ('S004', 'Emily', 'Davis'),
    ('S005', 'Chris', 'Brown');

INSERT INTO classes (class_name, credit_hours) VALUES
    ('Math 101', 3),
    ('History 101', 3),
    ('Computer Science 101', 4);

INSERT INTO groups (group_name) VALUES
    ('Group A'),
    ('Group B');

INSERT INTO class_group_mapping (class_id, group_id) VALUES
    (1, 1),
    (2, 1),
    (3, 2);
