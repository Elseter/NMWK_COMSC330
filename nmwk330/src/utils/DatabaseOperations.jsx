import Database from '@tauri-apps/plugin-sql';

export async function fetchAllStudents() {
    try {
      const db = await Database.load("sqlite:nmwk330.db");
      const result = await db.select(`
        SELECT 
          s.student_id, 
          s.run_id,
          s.name AS student_name,
          s.cumulative_gpa,
          sec.section_name,
          sec.credit_hours,
          g.letter_grade,
          g.numeric_grade
        FROM students s
        LEFT JOIN grades g ON s.student_id = g.student_id AND s.run_id = g.run_id
        LEFT JOIN sections sec ON g.section_id = sec.section_id AND g.run_id = sec.run_id
        ORDER BY s.student_id, sec.section_name;
      `);
  
      const formattedStudents = [];
      result.forEach(row => {
        let student = formattedStudents.find(s => s.student_id === row.student_id && s.run_id === row.run_id);
        if (!student) {
          student = {
            student_id: row.student_id,
            run_id: row.run_id,
            cumulative_gpa: row.cumulative_gpa,
            student_name: row.student_name,
            grades: []
          };
          formattedStudents.push(student);
        }
  
        if (row.section_name) {
          student.grades.push({
            section_name: row.section_name,
            credit_hours: row.credit_hours,
            letter_grade: row.letter_grade,
            numeric_grade: row.numeric_grade
          });
        }
      });
  
      return formattedStudents;
    } catch (error) {
      console.error('Error fetching student details:', error);
      return null;
    }
  }
  

export async function fetchAllSections() {
  try {
    const db = await Database.load("sqlite:nmwk330.db");
    const result = await db.select(`
      SELECT 
        sec.section_id,
        sec.section_name,
        sec.credit_hours,
        sec.section_gpa,
        s.student_id,
        s.name AS student_name,
        g.letter_grade,
        g.numeric_grade
      FROM sections sec
      LEFT JOIN grades g ON sec.section_id = g.section_id
      LEFT JOIN students s ON g.student_id = s.student_id
      ORDER BY sec.section_id, s.student_id;
    `);

    const formattedSections = [];
    result.forEach(row => {
      let section = formattedSections.find(sec => sec.section_id === row.section_id);
      if (!section) {
        section = {
          section_id: row.section_id,
          section_name: row.section_name,
          credit_hours: row.credit_hours,
          section_gpa: row.section_gpa,
          students: []
        };
        formattedSections.push(section);
      }

      if (row.student_id) {
        section.students.push({
          student_id: row.student_id,
          student_name: row.student_name,
          letter_grade: row.letter_grade,
          numeric_grade: row.numeric_grade
        });
      }
    });

    return formattedSections;
  } catch (error) {
    console.error('Error fetching section details:', error);
    return null;
  }
}

export async function fetchAllGroups() {
  try {
    const db = await Database.load("sqlite:nmwk330.db");
    const result = await db.select(`
      SELECT 
        g.group_id,
        g.group_name,
        g.group_gpa,
        r.run_id,
        r.name AS run_name,
        sec.section_id,
        sec.section_name,
        sec.credit_hours,
        sec.section_gpa
      FROM groups g
      LEFT JOIN runs r ON g.run_id = r.run_id
      LEFT JOIN section_groups sg ON g.group_id = sg.group_id
      LEFT JOIN sections sec ON sg.section_id = sec.section_id
      ORDER BY g.group_id, sec.section_id;
    `);

    const formattedGroups = [];
    result.forEach(row => {
      let group = formattedGroups.find(grp => grp.group_id === row.group_id);
      if (!group) {
        group = {
          group_id: row.group_id,
          group_name: row.group_name,
          group_gpa: row.group_gpa,
          run_id: row.run_id,
          run_name: row.run_name,
          sections: []
        };
        formattedGroups.push(group);
      }

      if (row.section_id) {
        const sectionExists = group.sections.some(s => s.section_id === row.section_id);
        if (!sectionExists) {
          group.sections.push({
            section_id: row.section_id,
            section_name: row.section_name,
            credit_hours: row.credit_hours,
            section_gpa: row.section_gpa
          });
        }
      }
    });

    return formattedGroups;
  } catch (error) {
    console.error('Error fetching group details:', error);
    return null;
  }
}

export async function fetchAllRuns() {
  try {
    const db = await Database.load("sqlite:nmwk330.db");
    const result = await db.select(`
      SELECT 
        r.run_id,
        r.name AS run_name,
        COUNT(DISTINCT g.group_id) AS group_count
      FROM runs r
      LEFT JOIN groups g ON r.run_id = g.run_id
      GROUP BY r.run_id
      ORDER BY r.run_id;
    `);

    return result;
  } catch (error) {
    console.error('Error fetching run details:', error);
    return null;
  }
}