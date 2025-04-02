import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { appLocalDataDir } from '@tauri-apps/api/path';
import { fetchAllStudents, fetchAllSections, fetchAllGroups, fetchAllRuns } from "../utils/DatabaseOperations";
import { calculateAverageGPA, calculateGradeDistribution } from "../utils/StatsOperations";
import Dashboard from "./Dashboard";
import Students from "./Students";
import Sections from "./Sections";
import Groups from "./Groups";
import FileUpload from "./FileUpload";
import GoodList from "./GoodList";
import BadList from "./BadList";
import "../App.css";

function App2() {
  const [loading, setLoading] = useState(true);
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
  const [filesDir, setFilesDir] = useState('');
  const [filesDirExists, setFilesDirExists] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const studentData = await fetchAllStudents();
        const sectionData = await fetchAllSections();
        const groupData = await fetchAllGroups();
        const runData = await fetchAllRuns();

        // Check files folder
        checkFilesFolder();

        setStudents(studentData || []);
        setSections(sectionData || []);
        setGroups(groupData || []);
        setRuns(runData || []);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // New useEffect to recalculate stats when data changes
  useEffect(() => {

    const avgGPA = calculateAverageGPA(students);
    const gradeDistribution = calculateGradeDistribution(students);

    setStats({
      totalStudents: students.length,
      totalSections: sections.length,
      totalGroups: groups.length,
      totalRuns: runs.length,
      averageGPA: avgGPA,
      gradeDistribution: gradeDistribution,
    });
  }, [students, sections, groups, runs]);

  // Check if the files folder is present
  const checkFilesFolder = async () => {
    try {
      const basefilesDir = await appLocalDataDir();
      console.log(basefilesDir);
      const filesDirExists = await invoke("check_files_folder", { dir: basefilesDir });
      if (!filesDirExists) {
        const create_success = await invoke("create_files_folder", { dir: basefilesDir });
        if (create_success) {
          setFilesDir(basefilesDir);
          setFilesDirExists(true);
          console.log('Files folder created successfully');
        }
      }
    } catch (error) {
      console.error('Error checking files folder:', error);
    }
  };

  return (
      <Router>
        <div className="app-container">
          <header className="app-header">
            <h1>Academic Analytics</h1>
            <nav className="main-nav">
              <ul>
                <li>
                  <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/students" className={({ isActive }) => isActive ? "active" : ""}>
                    Students
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/sections" className={({ isActive }) => isActive ? "active" : ""}>
                    Sections
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/groups" className={({ isActive }) => isActive ? "active" : ""}>
                    Groups
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/goodList" className={({ isActive }) => isActive ? "active" : ""}>
                    Good List
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/badList" className={({ isActive }) => isActive ? "active" : ""}>
                    Bad List
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/upload" className={({ isActive }) => isActive ? "active" : ""}>
                    Upload
                  </NavLink>
                </li>
              </ul>
            </nav>
          </header>

          <main className="app-content">
            <Routes>
              <Route
                  path="/"
                  element={
                    <Dashboard
                        loading={loading}
                        stats={stats}
                        runs={runs}
                    />
                  }
              />
              <Route
                  path="/students"
                  element={
                    <Students
                        loading={loading}
                        students={students}
                    />
                  }
              />
              <Route
                  path="/sections"
                  element={
                    <Sections
                        loading={loading}
                        sections={sections}
                    />
                  }
              />
              <Route
                  path="/groups"
                  element={
                    <Groups
                        loading={loading}
                        groups={groups}
                    />
                  }
              />
              <Route
                  path="/goodList"
                  element={
                    <GoodList
                        loading={loading}
                    />
                  }
              />
              <Route
                  path="/badList"
                  element={
                    <BadList
                        loading={loading}
                    />
                  }
              />
              <Route
                  path="/upload"
                  element={
                    <FileUpload
                        loading={loading}
                        filesDir={filesDir}
                        filesDirExists={filesDirExists}
                    />
                  }
              />
              <Route
                  path="*"
                  element={<div className="not-found">Page Not Found</div>}
              />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>NMWK Academic Analytics Dashboard &copy; {new Date().getFullYear()}</p>
          </footer>
        </div>
      </Router>
  );
}

export default App2;