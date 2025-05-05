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
    run_id INTEGER NOT NULL,
    section_name TEXT NOT NULL,
    credit_hours INTEGER NOT NULL,
    section_gpa DECIMAL(3,2),
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
);

-- Junction table for many-to-many relationship between sections and groups
CREATE TABLE section_groups (
    section_id INTEGER,
    group_id INTEGER,
    run_id INTEGER NOT NULL,
    PRIMARY KEY (section_id, group_id, run_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
);

-- Students table: Unique student_id, name, nullable cumulative_gpa
CREATE TABLE students (
    student_id TEXT,
    run_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cumulative_gpa DECIMAL(3,2),
    PRIMARY KEY (student_id, run_id),
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
);

-- Grades table: References student_id and section_id, letter grade, nullable numeric grade
CREATE TABLE grades (
    student_id TEXT NOT NULL,
    section_id INTEGER NOT NULL,
    run_id INTEGER NOT NULL,
    letter_grade TEXT CHECK(letter_grade IN ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W', 'P', 'NP')),
    numeric_grade DECIMAL(3,2),
    PRIMARY KEY (student_id, section_id, run_id),
    FOREIGN KEY (student_id, run_id) REFERENCES students(student_id, run_id) ON DELETE CASCADE,
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

