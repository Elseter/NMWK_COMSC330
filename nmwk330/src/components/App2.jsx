import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { appLocalDataDir } from '@tauri-apps/api/path';
import { fetchAllStudents, fetchAllSections, fetchAllGroups, fetchAllRuns, deleteAllRuns } from "../utils/DatabaseOperations";
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
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [runs, setRuns] = useState([]);
  const [filesDir, setFilesDir] = useState('');
  const [filesDirExists, setFilesDirExists] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const studentData = await fetchAllStudents();
        const sectionData = await fetchAllSections();
        const groupData = await fetchAllGroups();
        const runData = await fetchAllRuns();
  
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
  }, [reloadTrigger]);

  const checkFilesFolder = async () => {
    try {
      const basefilesDir = await appLocalDataDir();
      const filesDirExists = await invoke("check_files_folder", { dir: basefilesDir });
      if (!filesDirExists) {
        const create_success = await invoke("create_files_folder", { dir: basefilesDir });
        if (create_success) {
          setFilesDir(basefilesDir);
          setFilesDirExists(true);
        }
      }
    } catch (error) {
      console.error('Error checking files folder:', error);
    }
  };

  const handleDeleteAllRuns = async () => {
    await deleteAllRuns();
    setReloadTrigger(prev => prev + 1);
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
                <NavLink to="/goodlist" className={({ isActive }) => isActive ? "active" : ""}>
                  Goodlist
                </NavLink>
              </li>
              <li>
                <NavLink to="/badlist" className={({ isActive }) => isActive ? "active" : ""}>
                  Badlist
                </NavLink>
              </li>
              <li>
                <NavLink to="/upload" className={({ isActive }) => isActive ? "active" : ""}>
                  Upload
                </NavLink>
              </li>
              <li>
                <button onClick={handleDeleteAllRuns} className="delete-runs-btn">
                  Delete All Runs
                </button>
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
                  runs={runs}
                  groups={groups}
                  sections={sections}
                  students={students} 
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
              path="/goodlist" 
              element={
                <GoodList 
                  loading={loading} 
                />
              }
            />
            <Route 
              path="/badlist" 
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