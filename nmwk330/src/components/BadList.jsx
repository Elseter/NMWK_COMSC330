import React, { useEffect, useState } from 'react';
import { fetchAllSections } from "../utils/DatabaseOperations";

function BadList({ loading }) {
    const [sectionGrades, setSectionGrades] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sectionData = await fetchAllSections();
                const groupedStudents = new Map();

                sectionData.forEach(section => {
                    section.students
                        .filter(student => ['F', 'D-', 'D', 'D+'].includes(student.letter_grade))
                        .forEach(student => {
                            const key = student.student_id;
                            if (!groupedStudents.has(key)) {
                                groupedStudents.set(key, {
                                    student_id: student.student_id,
                                    student_name: student.student_name,
                                    classes: new Set()
                                });
                            }
                            groupedStudents.get(key).classes.add(
                                `${section.section_name} (${student.letter_grade})`
                            );
                        });
                });

                setSectionGrades(Array.from(groupedStudents.values()).map(student => ({
                    ...student,
                    classes: Array.from(student.classes)
                })));
            } catch (error) {
                console.error("Error fetching work list data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="work-list-tab">
            <h2>Work List</h2>
            {loading ? (
                <div className="loading">Loading work list data...</div>
            ) : (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Classes</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sectionGrades.map((student, index) => (
                            <tr key={index}>
                                <td>{student.student_id}</td>
                                <td>{student.student_name}</td>
                                <td>
                                    {student.classes.map((cls, idx) => (
                                        <div key={idx}>{cls}</div>
                                    ))}
                                </td>
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