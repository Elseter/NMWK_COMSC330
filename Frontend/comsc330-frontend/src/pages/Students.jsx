import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Students.css';
import API_URL from '../assets/config';

function Students(){
    // Const data
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch student data every time the webpage loads
    useEffect(() => {
        axios
        .get(`${API_URL}/fetch-all-student-info`)
        .then(response => {
            setStudents(response.data);
            setLoading(false);
        })
        .catch(error => {
            setError(error.message);
            setLoading(false);
        });
    }, []);


    return (
        <header className='app-header'>
            <h1>Student Records</h1>
        </header>
    );
}

export default Students;