function Sections({ loading, sections }) {
    return (
      <div className="sections-tab">
        <h2>Course Sections</h2>
        {loading ? (
          <div className="loading">Loading section data...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Section Name</th>
                  <th>Credit Hours</th>
                  <th>Section GPA</th>
                  <th>Students</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(section => (
                  <tr key={section.section_id}>
                    <td>{section.section_id}</td>
                    <td>{section.section_name}</td>
                    <td>{section.credit_hours}</td>
                    <td>{section.section_gpa || 'N/A'}</td>
                    <td>{section.students?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  
  export default Sections;