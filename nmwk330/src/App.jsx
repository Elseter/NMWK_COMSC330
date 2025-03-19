import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Database from '@tauri-apps/plugin-sql';
import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSections: 0,
    totalGroups: 0,
    totalRuns: 0,
    averageGPA: 0,
    gradeDistribution: {},
  });
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const studentData = await fetchAllStudents();
        const sectionData = await fetchAllSections();
        const groupData = await fetchAllGroups();
        const runData = await fetchAllRuns();
        
        setStudents(studentData || []);
        setSections(sectionData || []);
        setGroups(groupData || []);
        setRuns(runData || []);

        // Calculate statistics
        const avgGPA = calculateAverageGPA(studentData || []);
        const gradeDistribution = calculateGradeDistribution(studentData || []);
        
        setStats({
          totalStudents: studentData?.length || 0,
          totalSections: sectionData?.length || 0,
          totalGroups: groupData?.length || 0,
          totalRuns: runData?.length || 0,
          averageGPA: avgGPA,
          gradeDistribution: gradeDistribution,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateAverageGPA = (students) => {
    if (!students || students.length === 0) return 0;
    
    const validGPAs = students.filter(student => student.cummulative_gpa !== null);
    if (validGPAs.length === 0) return 0;
    
    const totalGPA = validGPAs.reduce((sum, student) => sum + student.cummulative_gpa, 0);
    return (totalGPA / validGPAs.length).toFixed(2);
  };

  const calculateGradeDistribution = (students) => {
    const distribution = {
      'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 
      'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'D-': 0, 
      'F': 0, 'I': 0, 'W': 0, 'P': 0, 'NP': 0
    };
    
    if (!students) return distribution;
    
    students.forEach(student => {
      if (!student.grades) return;
      
      student.grades.forEach(grade => {
        if (grade.letter_grade && distribution[grade.letter_grade] !== undefined) {
          distribution[grade.letter_grade]++;
        }
      });
    });
    
    return distribution;
  };

  async function fetchAllStudents() {
    try {
      const db = await Database.load("sqlite:nmwk330.db");
      const result = await db.select(`
        SELECT 
          s.student_id, 
          s.name AS student_name,
          s.cumulative_gpa,
          sec.section_name,
          sec.credit_hours,
          g.letter_grade,
          g.numeric_grade
        FROM students s
        LEFT JOIN grades g ON s.student_id = g.student_id
        LEFT JOIN sections sec ON g.section_id = sec.section_id
        ORDER BY s.student_id, sec.section_name;
      `);
  
      const formattedStudents = [];
      result.forEach(row => {
        let student = formattedStudents.find(s => s.student_id === row.student_id);
        if (!student) {
          student = {
            student_id: row.student_id,
            cummulative_gpa: row.cumulative_gpa,
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

  async function fetchAllSections() {
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

  async function fetchAllGroups() {
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

  async function fetchAllRuns() {
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

  // Render different UI tabs
  const renderDashboard = () => (
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

  const renderStudents = () => (
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
                  <td>{student.cummulative_gpa || 'N/A'}</td>
                  <td>{student.grades?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSections = () => (
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

  const renderGroups = () => (
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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Academic Analytics</h1>
        <nav className="main-nav">
          <ul>
            <li className={activeTab === "dashboard" ? "active" : ""}>
              <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
            </li>
            <li className={activeTab === "students" ? "active" : ""}>
              <button onClick={() => setActiveTab("students")}>Students</button>
            </li>
            <li className={activeTab === "sections" ? "active" : ""}>
              <button onClick={() => setActiveTab("sections")}>Sections</button>
            </li>
            <li className={activeTab === "groups" ? "active" : ""}>
              <button onClick={() => setActiveTab("groups")}>Groups</button>
            </li>
          </ul>
        </nav>
      </header>

      <main className="app-content">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "students" && renderStudents()}
        {activeTab === "sections" && renderSections()}
        {activeTab === "groups" && renderGroups()}
      </main>

      <footer className="app-footer">
        <p>NMWK Academic Analytics Dashboard &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;