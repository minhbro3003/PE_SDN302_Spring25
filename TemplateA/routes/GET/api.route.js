const express = require("express");
const db = require("../../models");
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

ApiRouter.get("/courses/:courseId/students", async (req, res, next) => {
    try {
        const courseId = req.params.courseId;

        const course = await db.Course.findById(courseId)
            // .select("-__v -createdAt -updatedAt")
            .populate("instructor")
            .populate("students")

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const students = course.students.map((m) => ({
            id: m._id,
            name: m.name.firstName + " " + m.name.lastName,
            email: m.email
        }))

        res.status(200).json({
            courseName: course.name,
            courseInstructor: course.instructor.name,
            students: students
        })
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

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


ApiRouter.get("/categories", async (req, res, next) => {
    try {
        const categories = await db.Category.find({})

        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
});




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

ApiRouter.get("/tutorials/:tutorialId/comments", async (req, res, next) => {
    try {
        const tutorialId = req.params.tutorialId;

        const tutorial = await db.Tutorial.findById(tutorialId)
            .populate("comments", "-__v")

        if (!tutorial) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: `tutorialId: ${tutorialId} does not exist`
                }
            });
        }
        res.status(200).json(tutorial.comments)

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

ApiRouter.get("/tutorials", async (req, res) => {
    try {
        const course = await db.Tutorial.find()
            .populate("images", "-createAt -__v -path")
            .populate("comments", "-__v")
            .populate("category", "-_id -createAt -__v")

        // const formatData = course.map(c => ({
        //     Title: c.Title,
        //     Description: c.Description,
        //     Instructor: {
        //         FullName: `${c.InstructorId.FullName.FirstName} ${c.InstructorId.FullName.LastName || ""}`.trim(),
        //         bio: c.InstructorId.bio
        //     },
        //     // list_reviews: c.list_reviews
        // }))

        res.status(200).json(course)
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})

ApiRouter.get("/movie/list", async (req, res) => {
    try {
        const movie = await db.Movie.find()
            .populate("producer")
            .populate("director")
            .populate("stars");

        // const count = await db.Course.countDocuments(course._id);
        const formatData = movie.map(c => ({
            _id: c._id,
            title: c.title,
            release: c.release,
            description: c.description,
            producer: c.producer.name,
            director: c.director.fullname,
            genres: c.genres,
            stars: c.stars.map(s => s.fullname)
        }))

        res.status(200).json(
            formatData
        )
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})

ApiRouter.get("/movie/by-start/:starId", async (req, res, next) => {
    try {
        const starId = req.params.starId;

        const movie = await db.Movie.find({ stars: starId })
            .populate("producer")
            .populate("director")
            .populate("stars");

        if (!movie) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: `This movie star does not exist`
                }
            });
        }

        const formatData = movie.map(c => ({
            _id: c._id,
            title: c.title,
            release: c.release,
            description: c.description,
            producer: c.producer.name,
            director: c.director.fullname,
            genres: c.genres,
            stars: c.stars.map(s => s.fullname)
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

ApiRouter.get("/movie/count-by-director/:directorName", async (req, res, next) => {
    try {
        const directorName = req.params.directorName;

        const director = await db.Director.findOne({ fullname: directorName })

        if (!director) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: "This director name does not exist"
                }
            });
        }
        const movie = await db.Movie.countDocuments({ director: director._id })

        res.status(200).json({
            director: directorName,
            numberOfNumber: movie
        })

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

ApiRouter.get('/tutorials/:id/comments', async (req, res, next) => {
    try {
        const id = req.params.id;

        const tutorials = await db.Tutorials.findById(id)
            .populate({ path: "comments", select: "_id username text createAt" });

        if (!tutorials) {
            return res.status(404).json({ message: 'Tutorial not found' });
        }
        res.json(tutorials.comments);
    } catch (error) {
        next(error);
    }
})

ApiRouter.get('/tutorials', async (req, res, next) => {
    try {
        const tutorials = await db.Tutorials.find()
            .populate({ path: "comments", select: "-__v" })
            .populate({ path: "images", select: "-createAt -__v -path" })
            .populate({ path: "category", select: "-__v" });
        res.json(tutorials);
    } catch (error) {
        next(error);
    }
})

ApiRouter.get('/employee/list', async (req, res, next) => {
    try {
        const employee = await db.Employee.find()
            .populate("jobs", "")
            .populate("department",)
        res.json(employee.map(emp => ({
            employeeId: emp._id,
            fullName: `${emp.name.firstName} ${emp.name.middleName} ${emp.name.lastName}`,
            email: emp.account.email,
            department: emp.department.name,
            jobs: emp.jobs.map(job => ({
                name: job.name,
                issues: job.issues.map(issue => ({
                    title: issue.title,
                    isCompleted: issue.isCompleted
                }))
            }))
        })));
    } catch (error) {
        next(error);
    }
})

ApiRouter.get('/department/:departmentId', async (req, res, next) => {
    try {
        const { departmentId } = req.params;
        const department = await db.Department.findById(departmentId)

        if (!department) {
            return res.status(404).json({ message: 'department not found' });
        }

        const employees = await db.Employee.find({ department: departmentId })
            .populate("department")

        const formatData = {
            department: department.name,
            manager: null,
            employees: employees.map(emp => ({
                employeeId: emp._id,
                fullName: `${emp.name.firstName} ${emp.name.middleName} ${emp.name.lastName}`,

            }))
        }
        const manager = employees.find(emp => emp._id.toString() === employees[0].manager?.toString());

        if (manager) {
            formatData.manager =
                `${manager.name.firstName} ${manager.name.middleName} ${manager.name.lastName}`

        }
        res.json(formatData)
    } catch (error) {
        next(error);
    }
})

ApiRouter.get("/list", async (req, res, next) => {
    try {
        const movie = await db.Movie.find({})
            .select("-__v -createdAt -updatedAt")
            .populate("producer")
            .populate("director")
            .populate("stars")

        const formatMovie = movie.map((m) => ({
            _id: m._id,
            title: m.title,
            release: m.release,
            description: m.description,
            producer: m.producer.name,
            director: m.director.fullname,
            genres: m.genres,
            stars: m.stars.map((s) => s.fullname)
        }))

        res.status(200).json(formatMovie)
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

//list all movies by genre 
//liet ke tat ca cac phim theo the loai 
ApiRouter.get("/by-genre/:genre", async (req, res, next) => {
    try {
        const genre = req.params.genre;

        const movie = await db.Movie.find({ genres: { $regex: new RegExp(genre, "i") } }).select("-__v -createdAt -updatedAt")
            .populate("producer", "-_id name")
            .populate("director", "-_id fullname")
            .populate("stars", "-_id fullname")

        if (movie.length === 0) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: "This movie genre does not exist"
                }
            });
        }
        const formatMovie = movie.map((m) => ({
            _id: m._id,
            title: m.title,
            release: m.release,
            description: m.description,
            producer: m.producer.name,
            director: m.director.fullname,
            genres: m.genres,
            stars: m.stars.map((s) => s.fullname)
        }))

        res.status(200).json(formatMovie)

        // Format lại ngày tháng trước khi trả về
        // const formattedMovies = movie.map(movie => ({
        //     ...movie.toObject(),
        //     release: new Date(movie.release).toLocaleDateString("en-GB").replace(/\//g, "-") // Định dạng dd/mm/yyyy | US: mm/dd/yyyy
        // }));

        // res.status(200).json(formattedMovies)
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

//Statistics of the number of movies by producer name 
//thong ke so luong phim theo ten nha san xuat 
ApiRouter.get("/count-by-producer/:producerName", async (req, res, next) => {
    try {
        const producerName = req.params.producerName;

        // Tìm ID của nhà sản xuất theo tên
        const producer = await db.Producer.findOne({ name: producerName });

        if (!producer) {
            return res.status(404).json({
                error: {
                    status: 404,
                    message: "This producer name does not exist"
                }
            });
        }

        // Đếm số lượng phim có producer này
        const numberOfMovie = await db.Movie.countDocuments({ producer: producer._id });

        res.status(200).json({
            producer: producerName,
            numberOfMovie: numberOfMovie
        });
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
});

ApiRouter.get("/products/all", async (req, res) => {
    try {
        const product = await db.Product.find()
        // .populate("InstructorId");


        //Nếu stock>9 thì viết ra 'many products left' còn <9 viết 'little stock left' 
        const checkStock = (stock) => {
            if (stock > 9) return "Many products left";
            else if (stock < 9) return "Little stock left";
            else return "";
        };

        const formatData = product.map(c => ({
            _id: c._id,
            name: c.name,
            description: c.description,
            stock: checkStock(c.stock),
            images: c.images.map(i => ({
                _id: i._id,
                url: i.url,
                caption: i.caption
            }))
        }))

        res.status(200).json({
            data: formatData,
            totalProducts: product.length
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

ApiRouter.get("/cart", authenticateToken, async (req, res) => {
    try {
        const user = await db.Cart.findOne({ user: req.user.userId }).select("-products")

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("User ID from JWT:", req.user.userId);


        res.json({
            message: "Success",
            data: user
        });
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
});

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: "Access token is required" });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: "Invalid token" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token has expired" });
        }
        next(error);
    }
};
ApiRouter.get("/dashboard", authenticateToken, async (req, res) => {
    try {
        const user = await db.Employee.findById(req.user.userId)
            .populate("department", "name");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Welcome to the Dashboard!",
            user: {
                id: user._id,
                email: user.account.email,
                department: user.department.name
            }
        });
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
