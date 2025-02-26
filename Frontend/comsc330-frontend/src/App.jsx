import React from 'react';
import {Route, Routes, Link} from 'react-router-dom';
import Sidebar from './assets/Sidebar';
import Home from './pages/Home';
import Groups from './pages/Groups';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Grades from './pages/Grades';
import './App.css';

// 3 decimal places in GPA 

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/students" element={<Students />} /> 
          <Route path="/classes" element={<Classes />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/grades" element={<Grades />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
