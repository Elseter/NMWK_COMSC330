import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './Students.css';
import API_URL from '../assets/config';
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';

function Students() {
  const [students, setStudents] = useState([]);
  const [allstudentData, setAllStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch student data when the component loads
  useEffect(() => {
    axios
      .get(`${API_URL}/fetch-all-student-info`)
      .then((response) => {
        setAllStudentData(response.data);
        setLoading(false);
        console.log(response.data);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Flatten student data to make it suitable for MantineReactTable
  const flattenedData = useMemo(() => {
    // remove the nested array
    let flatData = [];
    allstudentData.forEach((student) => {
      flatData.push({
        student_id: student.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        cumulative_gpa: student.cumulative_gpa,
      });
    });
    return flatData;

  }, [allstudentData]);

  // Define table columns
  const columns = useMemo(
    () => [
      { accessorKey: 'student_id', header: 'Student ID' },
      { accessorKey: 'first_name', header: 'First Name' },
      { accessorKey: 'last_name', header: 'Last Name' },
      { accessorKey: 'cumulative_gpa', header: 'Cumulative GPA' }
    ],
    []
  );

  const table = useMantineReactTable({
    columns,
    data: flattenedData,
  });

  if (loading) return <div>Loading Student Data...</div>;
  if (error) return <div>Error fetching Student Data: {error}</div>;

  return (
    <div className="students-container">
      <h1>Student Records</h1>
      <MantineReactTable table={table} />
    </div>
  );
}

export default Students;
