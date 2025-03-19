import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Modal, Button, Form, Container } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config/constant';

function ClassDataTables() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    class_name: '',
    credit_hours: ''
  });

  // Fetch class data when the component loads
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = () => {
    setLoading(true);
    axios
      .get(`${API_URL}/fetch-all-class-info`)
      .then((response) => {
        setClasses(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  };

  const handleRowClick = (classItem) => {
    setSelectedClass(classItem);
    setFormData({
      class_name: classItem.class_name,
      credit_hours: classItem.credit_hours
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
    const updatedClass = {
      ...selectedClass,
      class_name: formData.class_name,
      credit_hours: formData.credit_hours
    };

    axios
      .put(`${API_URL}/update-class/${selectedClass.class_id}`, updatedClass)
      .then((response) => {
        // Update the classes array with the edited class
        setClasses(
          classes.map((classItem) =>
            classItem.class_id === selectedClass.class_id ? updatedClass : classItem
          )
        );
        setSelectedClass(updatedClass);
        setEditMode(false);
        alert("Class information updated successfully!");
      })
      .catch((error) => {
        alert(`Error updating class: ${error.message}`);
      });
  };

  if (loading) return <div>Loading Class Data...</div>;
  if (error) return <div>Error fetching Class Data: {error}</div>;

  return (
    <React.Fragment>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Class Records</Card.Title>
              <span className="d-block m-t-5">
                All class records are displayed below. Click on a row to view or edit details.
              </span>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Class ID</th>
                    <th>Class Name</th>
                    <th>Credit Hours</th>
                    <th>Average GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((classItem) => (
                    <tr 
                      key={classItem.class_id} 
                      onClick={() => handleRowClick(classItem)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{classItem.class_id}</td>
                      <td>{classItem.class_name}</td>
                      <td>{classItem.credit_hours}</td>
                      <td>{classItem.average_gpa}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Class Details Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode 
              ? "Edit Class Information" 
              : "Class Information"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClass && (
            <Container>
              {/* First row - Non-editable Class ID and Average GPA */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Class ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedClass.class_id}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Average GPA</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedClass.average_gpa}
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Second row - Editable class name and credit hours */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Class Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Credit Hours</Form.Label>
                    <Form.Control
                      type="text"
                      name="credit_hours"
                      value={formData.credit_hours}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Students Table */}
              <Row>
                <Col>
                  <h5 className="mb-3">Enrolled Students</h5>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <Table bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>First Name</th>
                          <th>Last Name</th>
                          <th>Letter Grade</th>
                          <th>Numerical Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClass.students && selectedClass.students.length > 0 ? (
                          selectedClass.students.map((student, index) => (
                            <tr key={index}>
                              <td>{student.student_id}</td>
                              <td>{student.first_name}</td>
                              <td>{student.last_name}</td>
                              <td>{student.letter_grade}</td>
                              <td>{student.numerical_grade}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No students enrolled</td>
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

export default ClassDataTables;