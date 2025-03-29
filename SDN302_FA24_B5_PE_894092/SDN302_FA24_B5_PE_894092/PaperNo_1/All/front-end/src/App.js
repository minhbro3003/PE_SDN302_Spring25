import { Routes, Route } from "react-router-dom";
import TutorialList from "./TutorialList";
import CommentsPage from "./CommentsPage";

function App() {
    return (
        <Routes>
            <Route path="/" element={<TutorialList />} />
            <Route path="/tutorials/:id/comments" element={<CommentsPage />} />
        </Routes>
    );
}

export default App;
