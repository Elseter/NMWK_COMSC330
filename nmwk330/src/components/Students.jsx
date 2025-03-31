function Students({ loading, students }) {
    return (
      <div className="students-tab">
        <h2>Students</h2>
        {loading ? (
          <div className="loading">Loading student data...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>GPA</th>
                  <th>Courses</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.student_id}>
                    <td>{student.student_id}</td>
                    <td>{student.student_name}</td>
                    <td>{student.cumulative_gpa || 'N/A'}</td>
                    <td>{student.grades?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  
  export default Students;