import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Classes.css';
import API_URL from '../assets/config';

function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/fetch-all-class-info`)
      .then((response) => {
        setClasses(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading Class Data...</div>;
  if (error) return <div>Error fetching Class Data: {error}</div>;

  const toggleClass = (classId) => {
    setExpandedClass(expandedClass === classId ? null : classId);
  };

  return (
    <div className="classes-container">
      <h1>Classes</h1>
      {classes.map((cls) => (
        <div key={cls.class_id} className="class-card">
          <div className="class-header" onClick={() => toggleClass(cls.class_id)}>
            <h2>{cls.class_name}</h2>
            <p>Credit Hours: {cls.credit_hours}</p>
            <p>Average GPA: {cls.average_gpa || 'N/A'}</p>
          </div>

          {expandedClass === cls.class_id && (
            <div className="students-table-container">
              <h3>Enrolled Students</h3>
              {cls.students.length > 0 ? (
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Letter Grade</th>
                      <th>Numerical Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cls.students.map((student) => (
                      <tr key={student.student_id}>
                        <td>{student.student_id}</td>
                        <td>{student.first_name}</td>
                        <td>{student.last_name}</td>
                        <td>{student.letter_grade}</td>
                        <td>{student.numerical_grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No students enrolled.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Classes;
