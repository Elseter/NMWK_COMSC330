function Groups({ loading, groups }) {
    return (
      <div className="groups-tab">
        <h2>Student Groups</h2>
        {loading ? (
          <div className="loading">Loading group data...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Group Name</th>
                  <th>Run</th>
                  <th>Group GPA</th>
                  <th>Sections</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <tr key={group.group_id}>
                    <td>{group.group_id}</td>
                    <td>{group.group_name}</td>
                    <td>{group.run_name || 'N/A'}</td>
                    <td>{group.group_gpa || 'N/A'}</td>
                    <td>{group.sections?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  
  export default Groups;