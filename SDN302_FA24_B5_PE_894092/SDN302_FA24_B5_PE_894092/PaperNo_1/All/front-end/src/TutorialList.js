import { useEffect, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
function TutorialList() {
    // State cho ô tìm kiếm
    const [search, setSearch] = useState("");
    const [tutorials, setTutorials] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:9999/tutorials") // Gọi API bằng Axios
            .then((response) => {
                setTutorials(response.data); // Lưu dữ liệu vào state
                console.log("tutorials", response.data)
            })
            .catch((error) => {
                console.error("Lỗi khi lấy danh sách tutorials:", error);
            });
    }, []);

    return (
        <Container>
            <Row>
                <Col>
                    <h2 style={{ textAlign: "center" }}>Tutorial Online Courses</h2>
                </Col>
            </Row>
            <Row>
                <Col>
                    <h5>
                        <Link style={{ textDecoration: 'none' }} to={`/`}>Home page</Link>
                    </h5>
                </Col>
            </Row>
            <Row>
                <Col style={{ display: "flex", justifyContent: "center" }}>
                    <input
                        style={{ borderRadius: "5px", width: "700px", height: "40px", marginBottom: "10px" }}
                        placeholder="Enter title to search Tutorials"
                        type="text"
                        value={search}  // Giữ giá trị của input
                        onChange={(e) => setSearch(e.target.value)} // Cập nhật search state
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Form style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-evenly", marginTop: 25 }}>
                        {/* Sửa class -> className, sửa style -> object */}
                        {tutorials
                            .filter((tutorial) =>
                                tutorial.title?.toLowerCase().includes(search.toLowerCase()) // Tìm kiếm không phân biệt hoa thường
                            )

                            .map((tutorial, index) => (
                                <div key={tutorial._id?.$oid || tutorial._id || index} className="card" style={{ width: "18rem", marginBottom: "10px" }}>
                                    <img src={tutorial.images?.[0]?.url || "/default-image.jpg"} className="card-img-top" alt="Course" style={{ height: "150px" }} />
                                    <div className="card-body">
                                        <h4 className="card-title">
                                            {tutorial.title?.length > 19 ? tutorial.title.slice(0, 19) + " ..." : tutorial.title}
                                        </h4>
                                        <p className="card-title">Author: {tutorial.author}</p>
                                        <p className="card-text">Category: {tutorial.category.name}.</p>
                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                            <Link to={`/tutorials/${tutorial._id}/comments`} style={{ color: "blue", textAlign: "center", textDecoration: 'none' }}>
                                                Comments: {tutorial.comments.length}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}

                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default TutorialList;
