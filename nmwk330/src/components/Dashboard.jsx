import { useState, useEffect } from "react";
import Select from "react-select";
import { calculateAverageGPA, calculateGradeDistribution } from "../utils/StatsOperations";
import "./dashboard.css";

function Dashboard({ loading, runs, groups, sections, students }) {
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectGroup, setSelectGroup] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState(students);
  const [filteredSections, setFilteredSections] = useState(sections);
  const [filteredGroups, setFilteredGroups] = useState(groups);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSections: 0,
    totalGroups: 0,
    totalRuns: 0,
    averageGPA: 0,
    gradeDistribution: {},
  });

  // Calculate group z-score
  const calculateGroupZScore = (group) => {
    const groupGPA = group.group_gpa;
    const avgGrpGPA = filteredGroups.reduce((acc, grp) => acc + grp.group_gpa, 0) / filteredGroups.length;
    const stdDev = Math.sqrt(filteredGroups.reduce((acc, grp) => acc + Math.pow(grp.group_gpa - avgGrpGPA, 2), 0) / filteredGroups.length);
    return (groupGPA - avgGrpGPA) / stdDev;
  };

  const calculateSectionZScore = (section) => {
    const sectionGPA = section.section_gpa;
    const avgSecGPA = filteredSections.reduce((acc, sec) => acc + sec.section_gpa, 0) / filteredSections.length;
    const stdDev = Math.sqrt(filteredSections.reduce((acc, sec) => acc + Math.pow(sec.section_gpa - avgSecGPA, 2), 0) / filteredSections.length);
    return (sectionGPA - avgSecGPA) / stdDev;
  };

  // Prepare options for react-select
  const runOptions = [
    { value: "", label: "All Runs" },
    ...runs.map(run => ({
      value: run.run_id,
      label: run.run_name,
    })),
  ];

  useEffect(() => {
    let studentData = students;
    let sectionData = sections;
    let groupData = groups;

    if (selectedRun && selectedRun.value) {
      studentData = students.filter(student => student.run_id === selectedRun.value);
      sectionData = sections.filter(section => section.run_id === selectedRun.value);
      groupData = groups.filter(group => group.run_id === selectedRun.value);
    }

    setFilteredStudents(studentData);
    setFilteredSections(sectionData);
    setFilteredGroups(groupData);

    const avgGPA = calculateAverageGPA(studentData);
    const gradeDistribution = calculateGradeDistribution(studentData);

    setStats({
      totalStudents: studentData.length,
      totalSections: sectionData.length,
      totalGroups: groupData.length,
      totalRuns: runs.length,
      averageGPA: avgGPA,
      gradeDistribution: gradeDistribution,
    });
  }, [students, sections, groups, runs, selectedRun]);

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "40px",
      height: "40px",
      borderRadius: "8px",
      borderColor: state.isFocused ? "#2684FF" : "#ddd",
      backgroundColor: "#fff",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(38, 132, 255, 0.2)" : "none",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "#2684FF",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 12px",
      fontSize: "14px",
      color: "#333",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "40px",
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      padding: "6px",
      color: state.isFocused ? "#2684FF" : "#888",
      transition: "color 0.2s ease",
      "&:hover": {
        color: "#2684FF",
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: "6px",
      color: "#888",
      "&:hover": {
        color: "#2684FF",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      marginTop: "4px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#2684FF"
        : state.isFocused
          ? "#F0F8FF"
          : "#fff",
      color: state.isSelected ? "#fff" : "#333",
      padding: "10px 15px",
      cursor: "pointer",
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    singleValue: (base) => ({
      ...base,
      color: "#333",
      fontWeight: 500,
    }),
  };

  const getZScoreClass = (z) => {
    const num = parseFloat(z);
    if (num >= 2) return "z-score-gold pulse-gold";
    if (num <= -2) return "z-score-red pulse-red";
    return "z-score-normal";
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Academic Database Dashboard</h2>
        <div className="dashboard-filters">
          <label htmlFor="run-select">Select Run:</label>
          <Select
            id="run-select"
            className="run-select"
            styles={customSelectStyles}
            options={runOptions}
            value={runOptions.find(option => option.value === (selectedRun?.value || ""))}
            onChange={(selectedOption) => setSelectedRun(selectedOption)}
            isClearable
            placeholder="All Runs"
          />
        </div>
      </div>

      {!loading && (!students.length || !runs.length || !sections.length || !groups.length) ? (
        <div className="no-data">
          <h2>No data uploaded yet. Please go to the <strong>Upload</strong> tab.</h2>
        </div>
      ) : loading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <h3>Students</h3>
              <div className="stat-value">{stats.totalStudents}</div>
              <div className="stat-subtitle">Total Unique</div>
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
              <h3>Average GPA</h3>
              <div className="stat-value">{stats.averageGPA}</div>
              <div className="stat-subtitle">Overall Performance</div>
            </div>
          </div>

          <div className="dashboard-charts">
            <div className="chart-container">
              <h3>Overall Grade Distribution</h3>
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
          <div className="dashboard-extra-stats">
            {/* Group Statistics */}
            <div className="chart-container">
              <h3>Group Statistics</h3>
              <div className="group-stats">
                {filteredGroups.map(group => {
                  const groupZScore = calculateGroupZScore(group).toFixed(2);

                  return (
                    <div key={group.group_id} className="group-stat-card">
                      <h4>{group.group_name}</h4>
                      <p>Run: {group.run_name}</p>
                      <p>Average GPA: {group.group_gpa}</p>
                      <p>Num Sections: {group.sections.length}</p>
                      <p>Z-Score: {groupZScore}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Statistics */}
            <div className="chart-container">
              <h3>Section Statistics</h3>
              <div className="section-stats">
                {filteredSections.map(section => {
                  const run = runs.find(r => r.run_id === section.run_id);
                  const studentsInSection = filteredStudents.filter(student => student.run_id === section.run_id &&
                    /* check if section appears in grades array */
                    student.grades.some(grade => grade.section_name === section.section_name)
                  );
                  const runName = run ? run.run_name : "Unknown Run";
                  const sectionZScore = calculateSectionZScore(section).toFixed(2);
                  if (Math.abs(sectionZScore) > 2) {
                    console.log(`Section ${section.section_name} has a Z-score of ${sectionZScore}`);
                  }

                  return (
                    <div
                      key={section.section_id}
                      className={`section-stat-card ${sectionZScore <= -2
                          ? "pulse-alert"
                          : sectionZScore >= 2
                            ? "pulse-gold"
                            : ""
                        }`}
                    >
                      <h4>{section.section_name}</h4>
                      <p>Credit Hours: {section.credit_hours}</p>
                      <p>Average GPA: {section.section_gpa}</p>
                      <p># Students: {studentsInSection.length}</p>
                      <p>
                        Z-score:{" "}
                        <span className={`z-score-pill ${getZScoreClass(sectionZScore)}`}>
                          {sectionZScore}
                        </span>
                      </p>
                      <p>Run: {runName}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
}

export default Dashboard;
