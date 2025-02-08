
// This is the file that will store the API routes 
const express = require('express');
const db = require('../config/db')
const router = express.Router();

// TEMP ROUTES! REPLACE IN FINAL CODE 
// TESTING ONLY 
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

module.exports = router;

