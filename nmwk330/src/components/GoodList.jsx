import React, { useEffect, useState } from 'react';
import { fetchAllStudents } from "../utils/DatabaseOperations";

function GoodList({ loading }) {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentData = await fetchAllStudents();
                setStudents(studentData.filter(student => student.cumulative_gpa >= 3.5));
            } catch (error) {
                console.error("Error fetching good list data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="good-list-tab">
            <h2>Good List</h2>
            {loading ? (
                <div className="loading">Loading good list data...</div>
            ) : (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>GPA</th>
                        </tr>
                        </thead>
                        <tbody>
                        {students.map(student => (
                            <tr key={student.student_id}>
                                <td>{student.student_id}</td>
                                <td>{student.student_name}</td>
                                <td>{student.cumulative_gpa}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default GoodList;