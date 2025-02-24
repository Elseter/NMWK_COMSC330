import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Students.css';
import API_URL from '../assets/config';

function Students(){
    // Const data
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch student data every time the webpage loads
    useEffect(() => {
        axios
        .get(`${API_URL}/fetch-all-student-info`)
        .then(response => {
            setStudents(response.data);
            setLoading(false);
            console.log(response.data);
        })
        .catch(error => {
            setError(error.message);
            setLoading(false);
        });
    }, []);

    if (loading) return <div>Loading Student Data...</div>;
    if (error) return <div>Error fetching Student Data: {error}</div>;


    return (
        <div className='students-container'>
          <h1>Student Records</h1>
          <table className='students-table'>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Cumulative GPA</th>
                <th>Class</th>
                <th>Credit Hours</th>
                <th>Letter Grade</th>
                <th>Numerical Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) =>
                student.grades.map((grade, index) => (
                  <tr key={`${student.student_id}-${index}`}>
                    {index === 0 && (
                      <>
                        <td rowSpan={student.grades.length}>{student.student_id}</td>
                        <td rowSpan={student.grades.length}>{student.first_name}</td>
                        <td rowSpan={student.grades.length}>{student.last_name}</td>
                        <td rowSpan={student.grades.length}>{student.cumulative_gpa}</td>
                      </>
                    )}
                    <td>{grade.class_name}</td>
                    <td>{grade.credit_hours}</td>
                    <td>{grade.letter_grade}</td>
                    <td>{grade.numerical_grade}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }
    
    export default Students;