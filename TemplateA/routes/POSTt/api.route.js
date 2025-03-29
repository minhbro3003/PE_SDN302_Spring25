const express = require("express");
const db = require("../../models");
const bcrypt = require("bcryptjs");

const ApiRouter = express.Router();




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

// Create user
ApiRouter.post("/courses/create", async (req, res, next) => {
    try {
        const { name, description, duration, instructor, students } = req.body;

        if (!name) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: "Tên khóa học 'Lập trình Java' đã tồn tại"
                }
            });
        }
        const existsCourse = await db.Course.findOne({ name });
        if (existsCourse) {
            return res.status(400).json({
                error: {
                    status: 400,
                    message: `Ten khoa hoc '${name}' da ton tai `
                }
            });
        }

        const studentDocs = [];
        for (const studentData of students) {
            const { name, email } = studentData;
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: {
                        status: 400,
                        message: `Email '${email}' khong hop le`
                    }
                });
            }

            const firstName = name.firstName;
            const lastName = name.lastName;

            const student = new db.Student({
                name: { firstName, lastName },
                email
            })

            await student.save();
            studentDocs.push(student._id);
        }

        const course = new db.Course({
            name,
            description,
            duration,
            instructor: instructor._id,
            students: studentDocs
        })

        await course.save();

        res.status(201).json({
            message: "Khoa hoc va danh sach sinh vien duoc tao thanh cong",
            result: {
                courseId: course._id,
                courseName: course.name,
                studentsList: students.map(s => ({ name: s.name.firstName + " " + s.name.lastName }))
            }
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

ApiRouter.post("/tutorials/create", async (req, res,) => {
    try {
        const { title, author, category, images } = req.body;

        // Lưu từng image vào database
        const savedImages = await Promise.all(images.map(async (img) => {
            const newImage = new db.Image({
                path: img.path,
                url: img.url,
                caption: img.caption,
            });
            return await newImage.save();
        }));

        // Lấy danh sách _id, url và caption từ ảnh đã lưu
        const imageRefs = savedImages.map(img => ({
            _id: img._id,
            url: img.url,
            caption: img.caption,
        }));

        // Tạo tutorial mới
        const newTutorial = new db.Tutorial({
            title,
            author,
            category,
            images: imageRefs, // Lưu danh sách ảnh
            comments: []
        });

        const savedTutorial = await newTutorial.save();
        res.status(201).json(savedTutorial);

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})

ApiRouter.post("/movie/create", async (req, res, next) => {
    try {
        const { title, release, description, producer, director, genres, stars } = req.body;
        const newMovie = await db.Movie.create({ title, release, description, producer, director, genres, stars });
        const savedMovie = await newMovie.save();

        res.status(201).json(savedMovie);

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

ApiRouter.post('/tutorials/:id/comments', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username, text } = req.body;

        const tutorial = await db.Tutorials.findById(id);
        if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });

        const newComment = await db.Comments.create({ username, text, createAt: new Date() });

        await db.Tutorials.findByIdAndUpdate(id, { $push: { comments: newComment._id } });

        res.status(201).json(newComment);
    } catch (error) {
        next(error);
    }
});

ApiRouter.post("/employee/:employeeId/add-job", async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        const { name, issues, startDate, endDate } = req.body;

        //check employee ton tai 
        const employee = await db.Employee.findById(employeeId)
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        //create new job 
        const newJob = await db.Job.create({ name, issues, startDate, endDate });
        await newJob.validate();

        //save job
        await newJob.save();

        //update job list in employee 
        employee.jobs.push(newJob._id);
        await employee.save();

        //format data 
        const formatDat = {
            employeeId: employee._id,
            fullName: `${employee.name.firstName} ${employee.name.middleName} ${employee.name.lastName}`,
            jobsList: employee.jobs
        }
        res.status(201).json({
            message: 'Add a new job successfully',
            result: formatDat
        })
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(500).json({
                error: {
                    status: 500,
                    message: `job validation failed: ${error.path}: Cast to ${error.kind} failed for value '${error.value}' (type ${typeof error.value}) at path '${error.path}'`
                }
            });
        }

        // Xử lý lỗi khác
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
});

ApiRouter.post('/departments/create', async (req, res, next) => {
    try {
        const { name, description, employees } = req.body;

        // Create new department
        const newDepartment = await db.Department.create({
            name,
            description
        });

        // Process employees
        const createdEmployees = await Promise.all(employees.map(async (employeeData) => {
            // Hash password
            const hashedPassword = await bcrypt.hash(employeeData.account.password, 10);

            // Create employee with hashed password
            const employee = await db.Employee.create({
                ...employeeData,
                account: {
                    ...employeeData.account,
                    password: hashedPassword
                },
                department: newDepartment._id,
                manager: null, // Set manager as null initially
                dependents: [], // Initialize empty dependents array
                jobs: [] // Initialize empty jobs array
            });

            return employee;
        }));

        // Format response
        const response = {
            message: "Create a new department and add employees successfully",
            result: {
                departmentId: newDepartment._id,
                departmentName: newDepartment.name,
                employeesList: createdEmployees.map(emp => ({
                    name: `${emp.name.firstName} ${emp.name.middleName} ${emp.name.lastName}`
                }))
            }
        };

        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

ApiRouter.post("/movie/create", async (req, res, next) => {
    try {
        const { title, release, description, producer, director, genres, stars } = req.body;
        const newMovie = await db.Movie.create({ title, release, description, producer, director, genres, stars });
        const savedMovie = await newMovie.save();

        // Populate để lấy thông tin đầy đủ của producer, director và stars
        // const populatedMovie = await db.Movie.findById(savedMovie._id)
        //     .populate("producer", "name")  // Chỉ lấy field 'name' của producer
        //     .populate("director", "fullname")  // Chỉ lấy field 'name' của director
        //     .populate("stars", "fullname");    // Chỉ lấy field 'name' của stars

        // res.status(201).json({
        //     id: populatedMovie._id,
        //     title: populatedMovie.title,
        //     release: populatedMovie.release,
        //     description: populatedMovie.description,
        //     producer: populatedMovie.producer,  // Đã populate
        //     director: populatedMovie.director,  // Đã populate
        //     genres: populatedMovie.genres,
        //     stars: populatedMovie.stars,        // Đã populate
        //     createdAt: populatedMovie.createdAt,
        //     updatedAt: populatedMovie.updatedAt
        // });

        res.status(201).json(savedMovie)
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});

ApiRouter.post("/comment", async (req, res) => {
    try {
        const { userId, title, body, productId } = req.body;
        const newComment = await db.Comment.create({ title, body, user: userId })

        // Cập nhật product khi lưu comment
        const product = await db.Product.findById(productId);
        product.comments.push(newComment._id);
        await product.save();

        const newComment1 = await db.Comment.findById(newComment._id)
            .populate("user");

        const formatData = ({
            title: newComment1.title,
            body: newComment1.body,
            user: ({
                _id: newComment1.user._id,
                username: newComment1.user.username
            }),
            _id: newComment1._id,
            createdAt: newComment1.createdAt
        })
        res.status(201).json({
            newComment: formatData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
})

ApiRouter.post("/users", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await db.User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.User.create({ username, email, password: hashedPassword })

        const user = await db.User.findById(newUser._id).select("-password");
        res.status(201).json({
            message: "Created successfully",
            data: user
        })

    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        });
    }
})

ApiRouter.post("/users/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by account.email
        const user = await db.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Ensure JWT key exists
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        // Create Access Token with correct user data
        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            // message: "Login successful",
            id: user._id,
            name: user.username,
            email: user.email,
            accessToken: accessToken,
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

ApiRouter.post("/products", authenticateToken, async (req, res, next) => {
    try {
        const { name, description, price, discountPercentage, stock, brand, thumbnail } = req.body;
        const newProduct = await db.Product.create({ name, description, price, discountPercentage, stock, brand, thumbnail });
        const savedProduct = await newProduct.save();

        const product = await db.Product.findById(savedProduct._id)
        // .populate("Position")  // Chỉ lấy field 'name' của producer

        res.status(201).json({
            message: "Product created successfully",
            data: product
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

ApiRouter.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by account.email
        const user = await db.Employee.findOne({ "account.email": email });
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.account.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Ensure JWT key exists
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        // Create Access Token with correct user data
        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.account.email,
                fullName: `${user.name.firstName} ${user.name.middleName} ${user.name.lastName}`,
                department: user.department
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token: accessToken,
            // user: {
            //     id: user._id,
            //     fullName: `${user.name.firstName} ${user.name.middleName} ${user.name.lastName}`,
            //     email: user.account.email,
            //     department: user.department
            // }
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




module.exports = ApiRouter;
