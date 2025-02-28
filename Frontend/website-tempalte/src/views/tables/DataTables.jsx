import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Modal, Button, Form, Container } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config/constant';

function DataTables() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: ''
  });

  // Fetch student data when the component loads
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = () => {
    setLoading(true);
    axios
      .get(`${API_URL}/fetch-all-student-info`)
      .then((response) => {
        setStudents(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  };

  const handleRowClick = (student) => {
    setSelectedStudent(student);
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveChanges = () => {
    const updatedStudent = {
      ...selectedStudent,
      first_name: formData.first_name,
      last_name: formData.last_name
    };

    axios
      .put(`${API_URL}/update-student/${selectedStudent.student_id}`, updatedStudent)
      .then((response) => {
        // Update the students array with the edited student
        setStudents(
          students.map((student) =>
            student.student_id === selectedStudent.student_id ? updatedStudent : student
          )
        );
        setSelectedStudent(updatedStudent);
        setEditMode(false);
        alert("Student information updated successfully!");
      })
      .catch((error) => {
        alert(`Error updating student: ${error.message}`);
      });
  };

  if (loading) return <div>Loading Student Data...</div>;
  if (error) return <div>Error fetching Student Data: {error}</div>;

  return (
    <React.Fragment>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Student Records</Card.Title>
              <span className="d-block m-t-5">
                All student records are displayed below. Click on a row to view or edit details.
              </span>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Cumulative GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr 
                      key={student.student_id} 
                      onClick={() => handleRowClick(student)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{student.student_id}</td>
                      <td>{student.first_name}</td>
                      <td>{student.last_name}</td>
                      <td>{student.cumulative_gpa}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Student Details Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode 
              ? "Edit Student Information" 
              : "Student Information"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <Container>
              {/* First row - Non-editable Student ID and GPA */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Student ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedStudent.student_id}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Cumulative GPA</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedStudent.cumulative_gpa}
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Second row - Editable first name and last name */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Grades Table */}
              <Row>
                <Col>
                  <h5 className="mb-3">Course Grades</h5>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <Table bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Class Name</th>
                          <th>Credit Hours</th>
                          <th>Letter Grade</th>
                          <th>Numerical Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.grades && selectedStudent.grades.length > 0 ? (
                          selectedStudent.grades.map((grade, index) => (
                            <tr key={index}>
                              <td>{grade.class_name}</td>
                              <td>{grade.credit_hours}</td>
                              <td>{grade.letter_grade}</td>
                              <td>{grade.numerical_grade}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No grades available</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Col>
              </Row>
            </Container>
          )}
        </Modal.Body>
        <Modal.Footer>
          {editMode ? (
            <>
              <Button variant="secondary" onClick={toggleEditMode}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
              <Button variant="primary" onClick={toggleEditMode}>
                Edit
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}

export default DataTables;