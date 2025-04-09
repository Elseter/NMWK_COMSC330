import React, { useEffect, useState } from 'react';
import { fetchAllSections } from "../utils/DatabaseOperations";

function GoodList({ loading }) {
    const [sectionGrades, setSectionGrades] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sectionData = await fetchAllSections();
                const uniqueStudents = new Map();

                const goodListData = sectionData.flatMap(section =>
                    section.students
                        .filter(student => ['A', 'A-'].includes(student.letter_grade))
                        .map(student => ({
                            ...student,
                            sectionName: section.section_name
                        }))
                        .filter(student => {
                            const key = `${student.student_id}-${student.sectionName}`;
                            if (!uniqueStudents.has(key)) {
                                uniqueStudents.set(key, true);
                                return true;
                            }
                            return false;
                        })
                );

                setSectionGrades(goodListData);
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
                            <th>Section</th>
                            <th>Letter Grade</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sectionGrades.map((student, index) => (
                            <tr key={index}>
                                <td>{student.student_id}</td>
                                <td>{student.student_name}</td>
                                <td>{student.sectionName}</td>
                                <td>{student.letter_grade}</td>
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