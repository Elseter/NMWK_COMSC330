
// This is the file that will store the API routes 
const express = require('express');
const db = require('../config/db')
const router = express.Router();

// TEMP ROUTES! REPLACE IN FINAL CODE 
// TESTING ONlY 
router.get('/students', async(req, res) =>{
  try{
    const [rows, fields] = await db.execute('SELECT * FROM students');
    res.json(rows);
  }catch (error) {
    res.status(500).json({message: 'Error retrieving users', error});
  }
});

router.post('/students', async (req, res) => {
  const {id, firstname, lastname} = req.body; // In the future, check to make sure uploads contain correct info 
  try{
    const [result] = await db.execute('INSERT INTO students (student_id, first_name, last_name) VALUES (?, ?, ?)', [id, firstname, lastname]);
    res.status(201).json({ id: result.insertId, firstname, lastname});
  }catch{
    res.status(500).json({ message: 'Error adding user', error});
  }
});

router.get('/fetch-all-student-info', async(req, res) =>{
  try{

    const query = `
      SELECT 
        s.student_id, 
        s.first_name, 
        s.last_name,
        s.cumulative_gpa,
        c.class_name,
        c.credit_hours,
        g.grade
      FROM students s
      LEFT JOIN grades g ON s.student_id = g.student_id
      LEFT JOIN classes c ON g.class_id = c.class_id
      ORDER BY s.student_id, c.class_name;
    `;

    const [rows, fields] = await db.execute(query);
    const students = [];

    // Loop through all of the returned students from the database
    rows.forEach(row =>{

      let student = students.find(s => s.student_id === row.student_id);
      if (!student){
        student = {
          student_id: row.student_id,
          first_name: row.first_name,
          last_name: row.last_name,
          cumulative_gpa: row.cumulative_gpa,
          grades: []
        };
        students.push(student);
      }

      // Add all of the grades to each student 
      student.grades.push({
        class_name: row.class_name,
        credit_hours: row.credit_hours,
        grade: row.grade
      });
    });

    // Return the filled students list 
    res.json(students);

  } catch (error) {
      console.error('Error fetching student details:', error);
      res.status(500).json({ message: 'Error fetching student details', error });
  }
})

module.exports = router;

