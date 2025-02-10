
// This is the file that will store the API routes 
const express = require('express');
const db = require('../config/db')
const router = express.Router();


// FETCH ALL ROUTES 
// Three major routes for fetching complete batches on information from db in one go 
// 3 routes - ALL Students, ALL Classes, ALL Group
// These should return all neccessary information about that topic that we have stored in the database 
// ----------------------------------------------------------------------------------------------------

// FETCH ALL STUDENT INFO
/**
  * Route handler to fetch all student information, including personal details, GPA, and grades.
  * 
  * This function executes an SQL query that retrieves information about students, their grades,
  * the classes they've taken, and the credit hours for those classes. The results are organized 
  * by student, with each student containing their personal details and a list of their grades 
  * for each class.
  *
  *
  * The function performs the following:
  * - Executes a query to join the `students`, `grades`, and `classes` tables.
  * - Loops through the rows returned by the query and aggregates the information for each student.
  * - Creates a list of students with their respective grades and GPA.
  * - Returns the list of students as a JSON response.
  *
  * @route GET /fetch-all-student-info
  * @returns {Object[]} students - An array of student objects, each containing:
  *    - student_id: The unique identifier for the student.
  *    - first_name: The student's first name.
  *    - last_name: The student's last name.
  *    - cumulative_gpa: The student's cumulative GPA.
  *    - grades: A list of grades for the classes the student has attended, each including:
  *        - class_name: The name of the class.
  *        - credit_hours: The number of credit hours for the class.
  *        - grade: The grade the student received in the class.
  * @throws {Object} error - If there is an issue with the database query or response, a 500 status code and error message are returned.
  *
  */
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
});

/**
 * Route handler to fetch all class information, including student details and grades, without group associations.
 * 
 * This function executes an SQL query that retrieves information about classes, students enrolled in 
 * those classes, and their grades. The results are organized by class, with each class containing its 
 * students and their grades.
 * 
 * The function performs the following:
 * - Executes a query to join the `classes`, `students`, and `grades` tables.
 * - Loops through the rows returned by the query and aggregates the information for each class.
 * - Creates a list of classes with their respective students and grades.
 * - Returns the list of classes as a JSON response.
 * 
 * Error handling is included in case there are issues with the query execution.
 * 
 * @route GET /fetch-all-class-info
 * @returns {Object[]} classes - An array of class objects, each containing:
 *    - class_id: The unique identifier for the class.
 *    - class_name: The name of the class.
 *    - credit_hours: The number of credit hours for the class.
 *    - students: A list of students enrolled in the class, each containing:
 *        - student_id: The unique identifier for the student.
 *        - first_name: The student's first name.
 *        - last_name: The student's last name.
 *        - grade: The grade the student received in the class.
 * @throws {Object} error - If there is an issue with the database query or response, a 500 status code and error message are returned.
 */
router.get('/fetch-all-class-info', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.class_id,
        c.class_name,
        c.credit_hours,
        c.average_gpa,
        s.student_id,
        s.first_name,
        s.last_name,
        g.grade
      FROM classes c
      LEFT JOIN grades g ON c.class_id = g.class_id
      LEFT JOIN students s ON g.student_id = s.student_id
      ORDER BY c.class_id, s.student_id;
    `;
    
    const [rows, fields] = await db.execute(query);
    const classes = [];

    // Loop through all of the returned classes from the database
    rows.forEach(row => {
      let classItem = classes.find(cls => cls.class_id === row.class_id);
      
      if (!classItem) {
        classItem = {
          class_id: row.class_id,
          class_name: row.class_name,
          credit_hours: row.credit_hours,
          average_gpa: row.average_gpa,
          students: []
        };
        classes.push(classItem);
      }

      // Add student information and grades to the class
      if (row.student_id) {
        let student = classItem.students.find(s => s.student_id === row.student_id);
        if (!student) {
          student = {
            student_id: row.student_id,
            first_name: row.first_name,
            last_name: row.last_name,
            grade: row.grade
          };
          classItem.students.push(student);
        }
      }
    });

    // Return the filled class list without group information
    res.json(classes);

  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({ message: 'Error fetching class details', error });
  }
});


/**
 * Route handler to fetch all group information, including the classes associated with each group.
 * 
 * This function executes an SQL query to retrieve information about groups and the classes associated with each group.
 * The results are organized by group, with each group containing its associated classes.
 * 
 * The function performs the following:
 * - Executes a query to join the `groups`, `class_group_mapping`, and `classes` tables.
 * - Loops through the rows returned by the query and aggregates the information for each group.
 * - Creates a list of groups with their respective classes.
 * - Returns the list of groups as a JSON response.
 * 
 * Error handling is included in case there are issues with the query execution.
 * 
 * @route GET /fetch-all-group-info
 * @returns {Object[]} groups - An array of group objects, each containing:
 *    - group_id: The unique identifier for the group.
 *    - group_name: The name of the group.
 *    - group_gpa: The GPA of the group.
 *    - classes: A list of classes associated with the group, each containing:
 *        - class_id: The unique identifier for the class.
 *        - class_name: The name of the class.
 *        - credit_hours: The number of credit hours for the class.
 *        - class_gpa: The average gpa of the students in that class
 * @throws {Object} error - If there is an issue with the database query or response, a 500 status code and error message are returned.
 */
router.get('/fetch-all-group-info', async (req, res) => {
  try {
   const query = `
  SELECT 
    g.group_id,
    g.group_name,
    g.group_gpa,
    c.class_id,
    c.class_name,
    c.credit_hours,
    c.average_gpa
  FROM \`groups\` g  -- Use backticks around 'groups' to escape the reserved word
  LEFT JOIN class_group_mapping cgm ON g.group_id = cgm.group_id
  LEFT JOIN classes c ON cgm.class_id = c.class_id
  ORDER BY g.group_id, c.class_id;
`;
 
    
    const [rows, fields] = await db.execute(query);
    const groups = [];

    // Loop through all of the returned groups from the database
    rows.forEach(row => {
      let group = groups.find(g => g.group_id === row.group_id);

      if (!group) {
        group = {
          group_id: row.group_id,
          group_name: row.group_name,
          group_gpa: row.group_gpa,
          classes: []
        };
        groups.push(group);
      }

      // Loop through the classes of the group
      let classItem = group.classes.find(cls => cls.class_id === row.class_id);
      
      if (!classItem) {
        classItem = {
          class_id: row.class_id,
          class_name: row.class_name,
          credit_hours: row.credit_hours,
          class_gpa: row.average_gpa
        };
        group.classes.push(classItem);
      }
    });

    // Return the filled group list with associated classes
    res.json(groups);

  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ message: 'Error fetching group details', error });
  }
});


// SPECIFIC LOOKUPS
// - Routes for looking up information on a specific student, class, or group 
// - The format of these will be very simmilar to the queries above, but limited to one individual
// - The format of query, being executed on the db, and then parsing the results will be very simmilar 
//--------------------------------------------------------------------------------------------------------------

// Student lookup 
// -------------- 


// Class lookup 
// -------------- 


// Group lookup
// -------------- 


// DATABASE UPLOAD ROUTES
// - These routes provide paths for uploading data, in the form of jsons received from the frontend, to the database
// - In comparison to before, these will likely be post routes, compared to the get routes above
//--------------------------------------------------------------------------------------------------------------


// This exports the routes to be used by the main index.js file 
module.exports = router;

