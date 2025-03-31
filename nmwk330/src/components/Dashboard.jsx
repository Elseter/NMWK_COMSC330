import FileUpload from "./FileUpload";


function Dashboard({ loading, stats, runs }) {
    return (
      <div className="dashboard">
        <h2>Academic Database Dashboard</h2>
    
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : (
          <>
            <div className="stat-cards">
              <div className="stat-card">
                <h3>Students</h3>
                <div className="stat-value">{stats.totalStudents}</div>
                <div className="stat-subtitle">Total Enrolled</div>
              </div>
    
              <div className="stat-card">
                <h3>Sections</h3>
                <div className="stat-value">{stats.totalSections}</div>
                <div className="stat-subtitle">Course Sections</div>
              </div>
    
              <div className="stat-card">
                <h3>Groups</h3>
                <div className="stat-value">{stats.totalGroups}</div>
                <div className="stat-subtitle">Student Groups</div>
              </div>
    
              <div className="stat-card">
                <h3>Runs</h3>
                <div className="stat-value">{stats.totalRuns}</div>
                <div className="stat-subtitle">Analysis Runs</div>
              </div>
    
              <div className="stat-card">
                <h3>Average GPA</h3>
                <div className="stat-value">{stats.averageGPA}</div>
                <div className="stat-subtitle">Overall Performance</div>
              </div>
            </div>
    
            <div className="dashboard-charts">
              <div className="chart-container">
                <h3>Grade Distribution</h3>
                <div className="grade-distribution">
                  {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                    count > 0 && (
                      <div key={grade} className="grade-bar">
                        <div className="grade-label">{grade}</div>
                        <div className="grade-bar-visual" style={{ width: `${Math.min(100, (count / stats.totalStudents) * 300)}%` }}></div>
                        <div className="grade-count">{count}</div>
                      </div>
                    )
                  ))}
                </div>
              </div>
    
              <div className="chart-container">
                <h3>Recent Activity</h3>
                <div className="recent-activity">
                  <p>Last updated: {new Date().toLocaleString()}</p>
                  <ul className="activity-list">
                    {runs.slice(0, 5).map(run => (
                      <li key={run.run_id}>
                        Analysis run: <strong>{run.run_name}</strong> with {run.group_count} groups
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
  
  export default Dashboard;