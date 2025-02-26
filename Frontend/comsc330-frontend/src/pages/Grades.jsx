import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';
import API_URL from '../assets/config';

function Grades() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch grades data when the component loads
    useEffect(() => {
        axios
            .get(`${API_URL}/fetch-all-student-info`)
            .then((response) => {
                setStudents(response.data);
                setLoading(false);
                console.log(response.data);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    // flatten the student data for the MantineReactTable
    const flattenedData = useMemo(() => {
        let flatData = [];
        students.forEach((student) => {
            student.grades.forEach((grade) => {
                flatData.push({
                    student_id: student.student_id,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    class_name: grade.class_name,
                    credit_hours: grade.credit_hours,
                    letter_grade: grade.letter_grade,
                    numerical_grade: grade.numerical_grade
                });
            });
        });
        return flatData;
    }, [students]);

    const columns = useMemo(
        () => [
            { accessorKey: 'student_id', header: 'Student ID' },
            { accessorKey: 'first_name', header: 'First Name' },
            { accessorKey: 'last_name', header: 'Last Name' },
            { accessorKey: 'class_name', header: 'Class Name' },
            { accessorKey: 'credit_hours', header: 'Credit Hours' },
            { accessorKey: 'letter_grade', header: 'Letter Grade' },
            { accessorKey: 'numerical_grade', header: 'Numerical Grade' }
        ],
        []
    );

    const table = useMantineReactTable({
        columns,
        data: flattenedData,
      });


    if (loading) return <div>Loading Grades Data...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="grades-container">
          <h1>Grade Records</h1>
          <MantineReactTable table={table} />
        </div>
      );
    }

export default Grades;