const express = require("express");
const db = require("../models");
const bcrypt = require("bcryptjs");

const ApiRouter = express.Router();

ApiRouter.get("/courses", async (req, res) => {
    try {
        const course = await db.Course.find()
            .populate("InstructorId");

        const count = await db.Course.countDocuments(course._id);
        const formatData = course.map(c => ({
            Title: c.Title,
            Description: c.Description,
            Instructor: {
                FullName: `${c.InstructorId.FullName.FirstName} ${c.InstructorId.FullName.LastName || ""}`.trim(),
                bio: c.InstructorId.bio
            },
            // list_reviews: c.list_reviews
        }))

        res.status(200).json({
            NumberOfCourse: count,
            Courses: formatData
        })
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})

ApiRouter.get("/course/:courseId", async (req, res, next) => {
    try {
        const courseId = req.params.courseId;

        const course = await db.Course.findById(courseId)
            .populate("InstructorId")
            .populate("list_reviews.user_id")

        if (!course) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: `CourseId: ${courseId} does not exist`
                }
            });
        }

        const formatData = {
            Title: course.Title,
            Description: course.Description,
            Instructor: {
                FullName: `${course.InstructorId.FullName.FirstName} ${course.InstructorId.FullName.LastName || ""}`.trim(),
                bio: course.InstructorId.bio
            },
            Reviews: course.list_reviews.map(l => ({
                username: l.user_id.username,
                password: l.user_id.password,
                reviewtext: l.reviewtext,
                rating: l.rating,
                reviewDate: l.reviewDate
            }))
        }

        res.status(200).json(formatData)

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

// Validate email format
const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

// Validate password: >8 ký tự, chứa ít nhất 1 ký tự "_"
const validatePassword = (password) => password.length > 8 && password.includes("_");
ApiRouter.put("/course/:courseId/review", async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const { username, email, password, reviewtext, rating } = req.body;

        // 🟢 Kiểm tra email và password
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

//get
ApiRouter.get("/student/list", async (req, res) => {
    try {
        const student = await db.Student.find()
            .populate("class")

        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');  // Thêm số 0 nếu cần
            const month = String(d.getMonth() + 1).padStart(2, '0'); // Tháng tính từ 0 nên +1
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        const calculateAge = (dob) => {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();

            // Kiểm tra nếu sinh nhật chưa đến trong năm nay thì giảm tuổi đi 1
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age;
        };
        const formatData = student.map(s => ({
            _id: s._id,
            Code: s.Code,
            FullName: s.FullName,
            // Age: calculateAge(s.Dob),
            Age: new Date().getFullYear() - new Date(s.Dob).getFullYear(), // Tính tuổi đơn giản
            ClassName: s.class.Name,
            Subject: s.subjects.map(s => ({
                _id: s._id,
                Grade: s.Grade
            }))
        }))
        res.status(200).json(formatData);
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})

//list all movies by genre
//liet ke tat ca cac phim theo the loai
ApiRouter.get("/student/:studentCode", async (req, res, next) => {
    try {
        const studentCode = req.params.studentCode;

        const student = await db.Student.findOne({ Code: { $regex: new RegExp(studentCode, "i") } })
            .populate("class")
            .populate("subjects.subject")

        if (!student) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: "This student does not exist"
                }
            });
        }

        // Tính CPA
        const totalCredits = student.subjects.reduce((sum, sub) => sum + (sub.subject?.Credit || 0), 0);
        const totalGradePoints = student.subjects.reduce((sum, sub) => sum + ((sub.Grade || 0) * (sub.subject?.Credit || 0)), 0);
        const CPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

        const formatData = {
            _id: student._id,
            Code: student.Code,
            FullName: student.FullName,
            Age: new Date().getFullYear() - new Date(student.Dob).getFullYear(), // Tính tuổi đơn giản
            ClassName: student.class.Name,
            Subject: student.subjects.map(sub => ({
                SubjectName: sub.subject.Name,
                Grade: sub.Grade
            })),
            CPA: parseFloat(CPA) // Chuyển về số thực
        }

        res.status(200).json(formatData)


    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

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


// Create user
ApiRouter.post("/employees", async (req, res, next) => {
    try {
        const { FullName, BasicSalary, Departments, Position } = req.body;
        const newEmployee = await db.Employee.create({ FullName, BasicSalary, Departments, Position });
        const savedEmployee = await newEmployee.save();

        const employee = await db.Employee.findById(savedEmployee._id)
            .populate("Position")  // Chỉ lấy field 'name' của producer

        res.status(201).json({
            _id: employee._id,
            FullName: employee.FullName,
            BasicSalary: employee.BasicSalary,
            TotalSalary: employee.BasicSalary * employee.Position.Coefficient,
            Departments: employee.Departments,
            Position: employee.Position.Name,
        });

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

ApiRouter.get("/employees/:minSalary", async (req, res, next) => {
    try {
        const minSalary = parseFloat(req.params.minSalary);

        const employee = await db.Employee.find()
            .populate("Position")
            .populate("Departments")

        const filteredEmployee = employee.filter(emp => {
            return emp.BasicSalary * emp.Position.Coefficient >= minSalary
        })

        const formatData = filteredEmployee.map(e => ({
            _id: e._id,
            FullName: e.FullName,
            BasicSalary: e.BasicSalary,
            TotalSalary: e.BasicSalary * e.Position.Coefficient,
            Departments: e.Departments.map(d => d.Name),
            Position: e.Position.Name
        }))

        res.status(200).json(formatData)

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
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

ApiRouter.delete("/employees/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Tìm nhân viên cần xóa
        const employee = await db.Employee.findById(id).populate("Departments");

        if (!employee) {
            return res.status(404).json({ error: "Employee not found." });
        }

        // Kiểm tra từng phòng ban mà nhân viên đang thuộc về
        for (const department of employee.Departments) {
            const count = await db.Employee.countDocuments({ Departments: department._id });

            if (count === 1) { // Nếu chỉ còn duy nhất 1 người (chính nhân viên đang xóa)
                return res.status(400).json({
                    error: "Cannot delete the last employee in a department."
                });
            }
        }

        // Nếu không vi phạm điều kiện, tiến hành xóa nhân viên
        await db.Employee.findByIdAndDelete(id);

        res.status(200).json({ message: "Employee deleted successfully." });

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
