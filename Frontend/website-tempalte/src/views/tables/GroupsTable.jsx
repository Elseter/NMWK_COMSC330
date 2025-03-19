import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Modal, Button, Form, Container } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config/constant';

function GroupDataTables() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    group_name: ''
  });

  // Fetch group data when the component loads
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = () => {
    setLoading(true);
    axios
      .get(`${API_URL}/fetch-all-group-info`)
      .then((response) => {
        setGroups(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  };

  const handleRowClick = (group) => {
    setSelectedGroup(group);
    setFormData({
      group_name: group.group_name
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
    const updatedGroup = {
      ...selectedGroup,
      group_name: formData.group_name
    };

    axios
      .put(`${API_URL}/update-group/${selectedGroup.group_id}`, updatedGroup)
      .then((response) => {
        // Update the groups array with the edited group
        setGroups(
          groups.map((group) =>
            group.group_id === selectedGroup.group_id ? updatedGroup : group
          )
        );
        setSelectedGroup(updatedGroup);
        setEditMode(false);
        alert("Group information updated successfully!");
      })
      .catch((error) => {
        alert(`Error updating group: ${error.message}`);
      });
  };

  if (loading) return <div>Loading Group Data...</div>;
  if (error) return <div>Error fetching Group Data: {error}</div>;

  return (
    <React.Fragment>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Group Records</Card.Title>
              <span className="d-block m-t-5">
                All group records are displayed below. Click on a row to view or edit details.
              </span>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Group ID</th>
                    <th>Group Name</th>
                    <th>Group GPA</th>
                    <th>Classes Count</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr 
                      key={group.group_id} 
                      onClick={() => handleRowClick(group)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{group.group_id}</td>
                      <td>{group.group_name}</td>
                      <td>{group.group_gpa}</td>
                      <td>{group.classes.length}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Group Details Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode 
              ? "Edit Group Information" 
              : "Group Information"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGroup && (
            <Container>
              {/* First row - Non-editable Group ID and GPA */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Group ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedGroup.group_id}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Group GPA</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedGroup.group_gpa}
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Second row - Editable group name */}
              <Row className="mb-4">
                <Col>
                  <Form.Group>
                    <Form.Label>Group Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="group_name"
                      value={formData.group_name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Classes Table */}
              <Row>
                <Col>
                  <h5 className="mb-3">Associated Classes</h5>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <Table bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Class ID</th>
                          <th>Class Name</th>
                          <th>Credit Hours</th>
                          <th>Class GPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGroup.classes && selectedGroup.classes.length > 0 ? (
                          selectedGroup.classes
                            .filter(classItem => classItem.class_id) // Filter out null classes if any
                            .map((classItem, index) => (
                              <tr key={index}>
                                <td>{classItem.class_id}</td>
                                <td>{classItem.class_name}</td>
                                <td>{classItem.credit_hours}</td>
                                <td>{classItem.class_gpa}</td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">No classes associated with this group</td>
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

export default GroupDataTables;