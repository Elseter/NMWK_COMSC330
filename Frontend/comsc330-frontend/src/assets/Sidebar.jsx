import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
    return (
        <div className="sidebar">
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/groups">Groups</Link></li>
                <li><Link to="/classes">Sections</Link></li>
                <li><Link to="/students">Students</Link></li>
                <li><Link to="/grades">Grades</Link></li>
            </ul>
        </div>
    );
}

export default Sidebar;