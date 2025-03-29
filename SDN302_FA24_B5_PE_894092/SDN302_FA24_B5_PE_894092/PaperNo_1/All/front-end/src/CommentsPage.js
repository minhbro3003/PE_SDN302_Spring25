import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Container, Table } from "react-bootstrap";

function CommentsPage() {
    const { id } = useParams(); // Lấy ID tutorial từ URL
    const [comments, setComments] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:9999/tutorials/${id}/comments`)
            .then((response) => setComments(response.data))
            .catch((error) => console.error("Lỗi khi lấy danh sách comments:", error));
    }, [id]);

    return (
        <Container>
            <h2 style={{ textAlign: "center" }}>Tutorial Online Courses</h2>
            <h5><Link style={{ textDecoration: 'none' }} to="/">Home page</Link></h5>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Username</th>
                        <th>Text</th>
                        <th>Create At</th>
                    </tr>
                </thead>
                <tbody>
                    {comments.map((comment) => (
                        <tr key={comment._id}>
                            <td>{comment._id}</td>
                            <td>{comment.username}</td>
                            <td>{comment.text}</td>
                            <td>{new Date(comment.createAt).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
}

export default CommentsPage;
