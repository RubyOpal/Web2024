const { useState, useEffect } = React;
const {
  Navbar,
  Container,
  Nav,
  Alert,
  Card,
  Button,
  Table,
  Form,
  Row,
  Col
} = ReactBootstrap;

/** Initialize Firebase **/
const firebaseConfig = {
    apiKey: "AIzaSyBCq9_e7yhp2RbYPOSuFq5CsQjl6kieZe0",
  authDomain: "web2024-ad95b.firebaseapp.com",
  projectId: "web2024-ad95b",
  storageBucket: "web2024-ad95b.firebasestorage.app",
  messagingSenderId: "567108898226",
  appId: "1:567108898226:web:6c11f50e9aab52894ce8ab",
  measurementId: "G-274C6D7C6N"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function App() {
  // ----------- State -----------
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);

  // Student form fields
  const [stdId, setStdId] = useState("");
  const [stdTitle, setStdTitle] = useState(""); // default
  const [stdFirstName, setStdFirstName] = useState("");
  const [stdLastName, setStdLastName] = useState("");
  const [stdEmail, setStdEmail] = useState("");
  const [stdPhone, setStdPhone] = useState("");

  // ----------- Auth Observer -----------
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
      if (u) {
        setUser(u.toJSON());
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ----------- Firestore Functions -----------
  const readData = async () => {
    try {
      const snapshot = await db.collection("students").get();
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setStudents(list);
    } catch (err) {
      console.error("Error reading data:", err);
      alert("Read failed");
    }
  };

  const autoRead = () => {
    db.collection("students").onSnapshot((snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setStudents(list);
    });
  };

  const insertData = async () => {
    if (!stdId) {
      alert("กรุณากรอกรหัสนักศึกษา (Student ID).");
      return;
    }
    try {
      await db.collection("students").doc(stdId).set({
        title: stdTitle,
        first_name: stdFirstName,
        last_name: stdLastName,
        email: stdEmail,
        phone: stdPhone,
      });
      alert("บันทึกข้อมูลสำเร็จ! (Data saved successfully!)");
      clearForm();
    } catch (err) {
      console.error("Error writing document:", err);
      alert("Save failed");
    }
  };

  const deleteData = (std) => {
    if (!window.confirm(`ต้องการลบข้อมูลรหัส: ${std.id} ?`)) return;
    db.collection("students").doc(std.id).delete()
      .then(() => alert("ลบข้อมูลสำเร็จ! (Deleted successfully!)"))
      .catch((err) => alert("Delete error:" + err));
  };

  // ----------- Editing & UI Helpers -----------
  const editStudent = (std) => {
    setStdId(std.id);
    setStdTitle(std.title || "");
    setStdFirstName(std.first_name || "");
    setStdLastName(std.last_name || "");
    setStdEmail(std.email || "");
    setStdPhone(std.phone || "");
  };

  const clearForm = () => {
    setStdId("");
    setStdTitle("นาย");
    setStdFirstName("");
    setStdLastName("");
    setStdEmail("");
    setStdPhone("");
  };

  // ----------- Google Auth Functions -----------
  const googleLogin = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    firebase.auth().signInWithPopup(provider).catch((err) => {
      console.error("Google login error:", err);
    });
  };

  const googleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      firebase.auth().signOut().catch((err) => {
        console.error("Logout error:", err);
      });
    }
  };

  return (
    <>
      {/* ------- Navbar ------- */}
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand>
            <i className="bi bi-kanban" style={{ marginRight: 5 }}></i>
            Student Management
          </Navbar.Brand>

          <Nav className="ms-auto">
            {!user ? (
              <Button variant="outline-light" onClick={googleLogin}>
                Login with Google
              </Button>
            ) : (
              <div className="d-flex align-items-center">
                <img
                  src={user.photoURL}
                  alt="User"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    marginRight: 8
                  }}
                />
                <span className="text-white me-3">
                  {user.displayName || user.email}
                </span>
                <Button variant="outline-danger" onClick={googleLogout}>
                  Logout
                </Button>
              </div>
            )}
          </Nav>
        </Container>
      </Navbar>

      {/* ------- Main Content ------- */}
      <Container fluid className="mt-4">
        <Row>
          {/* -------- LEFT COLUMN: Student List & Controls -------- */}
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <Alert variant="info" className="mb-0 py-1 px-2">
                    รายชื่อนักศึกษา
                  </Alert>
                  <div>
                    <Button
                      variant="primary"
                      onClick={readData}
                      className="me-2"
                    >
                      Load Data
                    </Button>
                    <Button variant="info" onClick={autoRead}>
                      Live Sync
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <StudentTable
                  students={students}
                  onEdit={editStudent}
                  onDelete={deleteData}
                />
              </Card.Body>
            </Card>
          </Col>

          {/* -------- RIGHT COLUMN: Form for Add/Edit -------- */}
          <Col lg={4}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">เพิ่ม/แก้ไขข้อมูล นักศึกษา</h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3" controlId="stdId">
                    <Form.Label>รหัส</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="ระบุรหัสนักศึกษา"
                      value={stdId}
                      onChange={(e) => setStdId(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="stdTitle">
                    <Form.Label>คำนำหน้า</Form.Label>
                    <Form.Select
                      value={stdTitle}
                      onChange={(e) => setStdTitle(e.target.value)}
                    >
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="stdFirstName">
                    <Form.Label>ชื่อ</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="ชื่อ"
                      value={stdFirstName}
                      onChange={(e) => setStdFirstName(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="stdLastName">
                    <Form.Label>สกุล</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="นามสกุล"
                      value={stdLastName}
                      onChange={(e) => setStdLastName(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="stdEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="someone@example.com"
                      value={stdEmail}
                      onChange={(e) => setStdEmail(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="stdPhone">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="เบอร์โทร"
                      value={stdPhone}
                      onChange={(e) => setStdPhone(e.target.value)}
                    />
                  </Form.Group>

                  <div className="mt-3">
                    <Button
                      variant="primary"
                      onClick={insertData}
                      className="me-2"
                    >
                      บันทึกข้อมูล
                    </Button>
                    <Button variant="info" onClick={clearForm}>
                      ล้างข้อมูล
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* ------- Footer ------- */}
      <Container fluid className="mt-4">
        <hr />
        <p className="text-center text-muted">
          <small>
            By 653380218-5 Athitaya Boochakul <br />
            College of Computing, Khon Kaen University
          </small>
        </p>
      </Container>
    </>
  );
}

/** Student Table **/
function StudentTable({ students, onEdit, onDelete }) {
  return (
    <Table striped bordered hover responsive>
      <thead className="table-dark">
        <tr>
          <th>รหัส</th>
          <th>คำนำหน้า</th>
          <th>ชื่อ</th>
          <th>สกุล</th>
          <th>Email</th>
          <th>Phone</th>
          <th colSpan={2} className="text-center">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {students.length === 0 ? (
          <tr>
            <td colSpan={8} className="text-center">
              ไม่มีข้อมูลนักศึกษา
            </td>
          </tr>
        ) : (
          students.map((std) => (
            <tr key={std.id}>
              <td>{std.id}</td>
              <td>{std.title}</td>
              <td>{std.first_name}</td>
              <td>{std.last_name}</td>
              <td>{std.email}</td>
              <td>{std.phone}</td>
              <td>
                <Button size="sm" variant="info" onClick={() => onEdit(std)}>
                  แก้ไข
                </Button>
              </td>
              <td>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onDelete(std)}
                >
                  ลบ
                </Button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}

// Render to DOM
const container = document.getElementById("myapp");
const root = ReactDOM.createRoot(container);
root.render(<App />);