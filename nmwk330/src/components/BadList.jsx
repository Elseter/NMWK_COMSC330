import React, { useEffect, useState } from 'react';
import { fetchAllSections } from "../utils/DatabaseOperations";

function BadList({ loading }) {
    const [sectionGrades, setSectionGrades] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sectionData = await fetchAllSections();
                const uniqueStudents = new Map();

                const badListData = sectionData.flatMap(section =>
                    section.students
                        .filter(student => ['F', 'D-', 'D', 'D+'].includes(student.letter_grade))
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

                setSectionGrades(badListData);
            } catch (error) {
                console.error("Error fetching bad list data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="bad-list-tab">
            <h2>Bad List</h2>
            {loading ? (
                <div className="loading">Loading bad list data...</div>
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

export default BadList;