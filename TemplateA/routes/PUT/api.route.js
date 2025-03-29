const express = require("express");
const db = require("../../models");
const bcrypt = require("bcryptjs");

const ApiRouter = express.Router();



// Validate email format
const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

// Validate password: >8 ký tự, chứa ít nhất 1 ký tự "_"
const validatePassword = (password) => password.length > 8 && password.includes("_");
ApiRouter.put("/course/:courseId/review", async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const { username, email, password, reviewtext, rating } = req.body;

        // Kiểm tra email và password
        if (!validateEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ message: "Password must be > 8 characters and contain at least 1 underscore (_)" });
        }

        const course = await db.Course.findById(courseId)
            .populate("InstructorId")
            .populate("list_reviews.user_id")
        if (!course) {
            return res.status(500).json({
                message: `CourseId: ${courseId} does not exist`
            })
        }

        // Kiểm tra username có tồn tại không
        const user = await db.User.findOne({ username });
        if (!user) {
            return res.status(500).json({ message: `UserName: ${username} does not exist` });
        }

        const hasReviewed = course.list_reviews.find(review => review.user_id.equals(user._id))
        if (hasReviewed) {
            return res.status(500).json({ message: "User has already reviewed this course" })
        }

        const newReview = {
            user_id: user._id,
            reviewtext,
            rating,
            reviewDate: new Date()
        }

        course.list_reviews.push(newReview);
        await course.save();

        return res.json({
            message: "Review added successfully.",
            Title: course.Title,
            review: {
                username: user.username,
                reviewtext,
                rating,
                reviewDate: newReview.reviewDate.toISOString().split("T")[0]
            }
        });

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})



//Tổng điểm (Grade) (Grade × Credit) => 8.0×3 + 7.0×2 + 9.0×4 = 24 + 14 + 36=74
//Tổng số tín chỉ (Credit) => 3 + 2 + 4=9
//Tính CPA: => 74/9 = 8.22

// Format lại ngày tháng trước khi trả về
// const formattedMovies = movie.map(movie => ({
//     ...movie.toObject(),
//     release: new Date(movie.release).toLocaleDateString("en-GB").replace(/\//g, "-") // Định dạng dd/mm/yyyy | US: mm/dd/yyyy
// }));

// res.status(200).json(formattedMovies)


//update student by id
ApiRouter.put("/student/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subjects } = req.body; // Danh sách môn học

        //  Kiểm tra studentId có tồn tại không
        const student = await db.Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                error: { status: 404, message: "StudentID does not exist" }
            });
        }

        // Cập nhật hoặc thêm môn học
        for (const newSubject of subjects) {
            const { subject_id, Grade } = newSubject;

            // Kiểm tra subject_id có tồn tại trong DB không
            const subjectExists = await db.Subject.findById(subject_id);
            if (!subjectExists) {
                return res.status(404).json({
                    error: { status: 404, message: `SubjectID: ${subject_id} does not exist` }
                });
            }

            // Kiểm tra xem môn học này đã có trong danh sách chưa
            const existingSubject = student.subjects.find(s => s.subject.equals(subject_id));

            if (existingSubject) {
                // Nếu môn học đã tồn tại → Cập nhật điểm
                existingSubject.Grade = Grade;
            } else {
                // Nếu chưa có → Thêm mới vào danh sách
                student.subjects.push({ subject: subject_id, Grade });
            }
        }

        // Lưu dữ liệu cập nhật
        await student.save();

        // Populate để lấy thông tin đầy đủ về môn học
        const updatedStudent = await db.Student.findById(studentId)
            .populate("class")
            .populate("subjects.subject");

        res.status(200).json({
            _id: updatedStudent._id,
            Code: updatedStudent.Code,
            FullName: updatedStudent.FullName,
            ClassName: updatedStudent.class.Name,
            Subjects: updatedStudent.subjects.map(s => ({
                SubjectName: s.subject.Name,
                Grade: s.Grade
            }))
        });

    } catch (error) {
        res.status(500).json({
            error: { status: 500, message: error.message }
        });
    }
});

ApiRouter.put("/employees/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { FullName, BasicSalary, Departments, Position } = req.body;

        const updatedEmployee = await db.Employee.findByIdAndUpdate(id,
            { Departments, Position },
            { new: true }
        );

        if (Departments.length > 4) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: "An employee cannot belong to more than 4 departments"
                }
            });
        }

        if (!updatedEmployee) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: "Employee not found"
                }
            });
        }
        // updatedEmployee.Departments = Departments;
        // updatedEmployee.Position = Position;

        // const updateDoc = await updatedEmployee.save();

        const employees = await db.Employee.findById(updatedEmployee._id)
            .populate("Position")
            .populate("Departments")

        res.status(200).json({
            _id: employees._id,
            FullName: employees.FullName,
            BasicSalary: employees.BasicSalary,
            TotalSalary: employees.BasicSalary * employees.Position.Coefficient,
            Departments: employees.Departments.map(d => d.Name),
            Position: employees.Position.Name
        });

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})

ApiRouter.put("/movie/:movieId/add-stars", async (req, res, next) => {
    try {
        const { movieId } = req.params;
        const stars = req.body;
        const movie = await db.Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: "This movie does not exist"
                }
            });
        }
        const newStar = stars.filter(starId => !movie.stars.includes(starId));

        movie.stars.push(...newStar);
        await movie.save();
        res.status(200).json(movie);

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
});

// Xóa Diễn Viên khỏi Bộ Phim 
//remove a star from the corresponding movie according to _id 
ApiRouter.put("/:movieId/remove-star/:starId", async (req, res, next) => {
    try {
        const { movieId, starId } = req.params;

        // kiem tra id ton tai khong 
        const movie = await db.Movie.findById(movieId);

        if (!movie) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: "This movie does not exist"
                }
            });
        }

        //kiem tra xem star co trong danh sach ko 
        if (!movie.stars.includes(starId)) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: "This star does not exist in this movie"
                }
            });
        }

        //xoa khoi danh sach 
        await db.Movie.findByIdAndUpdate(movieId, {
            $pull: { stars: starId }
        })

        // 🛠️ Load lại dữ liệu sau khi cập nhật
        const updatedMovie = await db.Movie.findById(movieId)

        res.status(200).json(updatedMovie);
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
});

ApiRouter.put("/:movieId/add-stars", async (req, res, next) => {
    try {
        const { movieId } = req.params;
        const stars = req.body;
        const movie = await db.Movie.findById(movieId);
        const newStar = stars.filter(starId => !movie.stars.includes(starId));

        movie.stars.push(...newStar);
        await movie.save();
        res.status(200).json(
            movie
        );

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
});

ApiRouter.put("/movie/update/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, release, description, producer, director, genres, stars } = req.body;

        const updatedMovie = await db.Movie.findByIdAndUpdate(
            id,
            { title, release, description, producer, director, genres, stars },
            { new: true, runValidators: true }
        );

        if (!updatedMovie) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: "Movie not found"
                }
            });
        }

        res.status(200).json(updatedMovie);
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
});


module.exports = ApiRouter;
