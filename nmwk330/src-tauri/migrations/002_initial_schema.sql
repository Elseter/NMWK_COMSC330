PRAGMA foreign_keys = ON;

-- Runs table: Auto-incrementing primary key, with a string name
CREATE TABLE runs (
    run_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

-- Groups table: Unique ID, associated with a run, non-null group_name, nullable group_gpa
CREATE TABLE groups (
    group_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    group_name TEXT NOT NULL,
    group_gpa DECIMAL(3,2),
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
);

-- Sections table: Auto-incrementing primary key, non-null section_name, credit_hours, nullable avg_gpa
CREATE TABLE sections (
    section_id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_name TEXT NOT NULL,
    credit_hours INTEGER NOT NULL,
    section_gpa DECIMAL(3,2)
);

-- Junction table for many-to-many relationship between sections and groups
CREATE TABLE section_groups (
    section_id INTEGER,
    group_id INTEGER,
    PRIMARY KEY (section_id, group_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE
);

-- Students table: Unique student_id, name, nullable cumulative_gpa
CREATE TABLE students (
    student_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cumulative_gpa DECIMAL(3,2)
);

-- Grades table: References student_id and section_id, letter grade, nullable numeric grade
CREATE TABLE grades (
    student_id TEXT NOT NULL,
    section_id INTEGER NOT NULL,
    letter_grade TEXT CHECK(letter_grade IN ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W', 'P', 'NP')),
    numeric_grade DECIMAL(3,2),
    PRIMARY KEY (student_id, section_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE
);

-- Grade conversions table: Maps letter grades to numeric values
CREATE TABLE grade_conversions (
    letter_grade TEXT PRIMARY KEY,
    numeric_value DECIMAL(3,2)
);

-- Insert predefined grade conversions
INSERT INTO grade_conversions (letter_grade, numeric_value) VALUES
    ('A', 4.00), ('A-', 3.67), ('B+', 3.33), ('B', 3.00), ('B-', 2.67),
    ('C+', 2.33), ('C', 2.00), ('C-', 1.67), ('D+', 1.33), ('D', 1.00), ('D-', 0.67),
    ('F', 0.00), ('I', NULL), ('W', NULL), ('P', NULL), ('NP', NULL);

-- Triggers
-- Trigger to set numeric_grade before inserting a new grade
CREATE TRIGGER before_grade_insert
AFTER INSERT ON grades
FOR EACH ROW
BEGIN
    UPDATE grades
    SET numeric_grade = (SELECT numeric_value FROM grade_conversions WHERE letter_grade = NEW.letter_grade)
    WHERE rowid = NEW.rowid;
END;


-- Trigger to update numeric_grade when a grade is updated
CREATE TRIGGER before_grade_update
AFTER UPDATE ON grades
FOR EACH ROW
BEGIN
    UPDATE grades
    SET numeric_grade = (SELECT numeric_value FROM grade_conversions WHERE letter_grade = NEW.letter_grade)
    WHERE rowid = NEW.rowid;
END;

-- ---------------------------------------------------------------------
-- Triggers for student cummulative GPA
-- Trigger to update cumulative_gpa when a new grade is inserted
CREATE TRIGGER after_grade_insert
AFTER INSERT ON grades
FOR EACH ROW
BEGIN
    UPDATE students
    SET cumulative_gpa = ROUND((
        SELECT SUM(g.numeric_grade * s.credit_hours) / SUM(s.credit_hours)
        FROM grades g
        JOIN sections s ON g.section_id = s.section_id
        WHERE g.student_id = NEW.student_id
        AND g.numeric_grade IS NOT NULL
    ), 3)
    WHERE student_id = NEW.student_id;
END;

-- Trigger to update cumulative_gpa when a grade is updated
CREATE TRIGGER after_grade_update
AFTER UPDATE ON grades
FOR EACH ROW
BEGIN
    UPDATE students
    SET cumulative_gpa = ROUND((
        SELECT SUM(g.numeric_grade * s.credit_hours) / SUM(s.credit_hours)
        FROM grades g
        JOIN sections s ON g.section_id = s.section_id
        WHERE g.student_id = NEW.student_id
        AND g.numeric_grade IS NOT NULL
    ), 3)
    WHERE student_id = NEW.student_id;
END;

-- ---------------------------------------------------------------------
-- Triggers for section GPA
-- Trigger to update section_gpa when a new grade is inserted
CREATE TRIGGER after_grade_insert_section
AFTER INSERT ON grades
FOR EACH ROW
BEGIN
    UPDATE sections
    SET section_gpa = (
        SELECT ROUND(AVG(g.numeric_grade), 3)
        FROM grades g
        WHERE g.section_id = NEW.section_id
    )
    WHERE section_id = NEW.section_id;
END;

CREATE TRIGGER after_grade_update_section
AFTER UPDATE ON grades
FOR EACH ROW
BEGIN
    UPDATE sections
    SET section_gpa = (
        SELECT ROUND(AVG(g.numeric_grade), 3)
        FROM grades g
        WHERE g.section_id = NEW.section_id
    )
    WHERE section_id = NEW.section_id;
END;

-- ---------------------------------------------------------------------
-- Triggers for group GPA
CREATE TRIGGER after_section_insert_group
AFTER INSERT ON sections
FOR EACH ROW
BEGIN
    -- Update the group's GPA based on the weighted average of the section GPAs
    UPDATE groups
    SET group_gpa = ROUND((
        SELECT SUM(s.section_gpa * s.credit_hours) / SUM(s.credit_hours)
        FROM sections s
        JOIN section_groups sg ON s.section_id = sg.section_id
        WHERE sg.group_id = (SELECT group_id FROM section_groups WHERE section_id = NEW.section_id)
        AND s.section_gpa IS NOT NULL 
    ), 3)
    WHERE group_id = (SELECT group_id FROM section_groups WHERE section_id = NEW.section_id);
END;

CREATE TRIGGER after_section_update_group
AFTER UPDATE ON sections
FOR EACH ROW
BEGIN
    -- Update the group's GPA based on the weighted average of the section GPAs
    UPDATE groups
    SET group_gpa = ROUND((
        SELECT SUM(s.section_gpa * s.credit_hours) / SUM(s.credit_hours)
        FROM sections s
        JOIN section_groups sg ON s.section_id = sg.section_id
        WHERE sg.group_id = (SELECT group_id FROM section_groups WHERE section_id = NEW.section_id)
        AND s.section_gpa IS NOT NULL 
    ), 3)
    WHERE group_id = (SELECT group_id FROM section_groups WHERE section_id = NEW.section_id);
END;




-- Test Values
-- Test Data for "runs" table
INSERT INTO runs (name) VALUES ('Fall 2024');
INSERT INTO runs (name) VALUES ('Spring 2025');

-- Test Data for "groups" table
INSERT INTO groups (run_id, group_name) VALUES (1, 'Group A');
INSERT INTO groups (run_id, group_name) VALUES (1, 'Group B');
INSERT INTO groups (run_id, group_name) VALUES (2, 'Group C');

-- Test Data for "sections" table
INSERT INTO sections (section_name, credit_hours) VALUES ('Math 101', 3);
INSERT INTO sections (section_name, credit_hours) VALUES ('History 201', 4);
INSERT INTO sections (section_name, credit_hours) VALUES ('Chemistry 301', 3);
INSERT INTO sections (section_name, credit_hours) VALUES ('Physics 101', 4);
INSERT INTO sections (section_name, credit_hours) VALUES ('English 202', 3);
INSERT INTO sections (section_name, credit_hours) VALUES ('Biology 401', 4);
INSERT INTO sections (section_name, credit_hours) VALUES ('Computer Science 101', 3);

-- Test Data for "section_groups" table
INSERT INTO section_groups (section_id, group_id) VALUES (1, 1);
INSERT INTO section_groups (section_id, group_id) VALUES (2, 1);
INSERT INTO section_groups (section_id, group_id) VALUES (3, 2);
INSERT INTO section_groups (section_id, group_id) VALUES (4, 2);
INSERT INTO section_groups (section_id, group_id) VALUES (5, 3);
INSERT INTO section_groups (section_id, group_id) VALUES (6, 3);
INSERT INTO section_groups (section_id, group_id) VALUES (7, 1);

-- Test Data for "students" table
INSERT INTO students (student_id, name) VALUES ('S001', 'John Doe');
INSERT INTO students (student_id, name) VALUES ('S002', 'Jane Smith');
INSERT INTO students (student_id, name) VALUES ('S003', 'Alice Johnson');
INSERT INTO students (student_id, name) VALUES ('S004', 'Robert Brown');
INSERT INTO students (student_id, name) VALUES ('S005', 'Emily Davis');
INSERT INTO students (student_id, name) VALUES ('S006', 'Michael Wilson');
INSERT INTO students (student_id, name) VALUES ('S007', 'Olivia Martinez');
INSERT INTO students (student_id, name) VALUES ('S008', 'William Taylor');
INSERT INTO students (student_id, name) VALUES ('S009', 'Sophia Anderson');
INSERT INTO students (student_id, name) VALUES ('S010', 'James Thomas');
INSERT INTO students (student_id, name) VALUES ('S011', 'Charlotte White');
INSERT INTO students (student_id, name) VALUES ('S012', 'Daniel Harris');


-- Test Data for "grades" table
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S001', 1, 'A');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S001', 2, 'B+');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S002', 1, 'B');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S003', 3, 'A-');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S004', 1, 'B-');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S005', 1, 'C+');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S006', 2, 'C');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S007', 2, 'C-');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S008', 3, 'D+');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S009', 3, 'D');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S010', 4, 'D-');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S011', 4, 'F');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S012', 5, 'I');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S001', 5, 'W');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S002', 6, 'P');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S003', 6, 'NP');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S004', 7, 'A-');
INSERT INTO grades (student_id, section_id, letter_grade) VALUES ('S005', 7, 'B+');


