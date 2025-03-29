const express = require("express");
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ApiRouter = express.Router();

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

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: "No token provide" });
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

// "name": "nothing",
//     "description": "this a mobile is not shown ",
//         "price": 34,
//             "discountPercentage": 20.12,
//                 "stock": 0,
//                     "brand": "oppo",
//                         "thumbnail": "/images/oppomode.png",
// Create user
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

//câu 3. Tạo giỏ hàng (cart), sau đó mua hàng (đưa product vào giỏ hàng) – Gồm 2 API
//API 1: Tạo giỏ hàng
// {
//     "userId" :"67c42a83c59da0009392205d"
// }


ApiRouter.post("/cart", async (req, res, next) => {
    try {
        const { userId } = req.body;
        const newCart = await db.Cart.create({ user: userId });
        res.status(200).json(newCart);
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
});


//API 2: Mua hàng
//update lại cart vừa tìm
// {
//   "productId":"6525ef1dcf96890e7ad4e10a",
//   "cartId":"67cc7f0ce422bbd7471f02a6",
//   "quantity" : 2
// }
ApiRouter.put("/cart", async (req, res, next) => {
    try {
        const { productId, cartId, quantity } = req.body;


        const product = await db.Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }


        const cart = await db.Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }


        // Kiểm tra stock
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Not enough stock available" });
        }


        let discountAmount = (product.price * product.discountPercentage) / 100;
        let discountedPrice = product.price - discountAmount;


        // Kiểm tra sản phẩm đã tồn tại chưa
        let existingProduct = cart.products.find(item => item._id.toString() === productId);


        if (existingProduct) {
            // Nếu sản phẩm đã có trong giỏ hàng, chỉ cập nhật số lượng và tổng tiền
            existingProduct.quantity += quantity;
            existingProduct.total = discountedPrice * existingProduct.quantity;
        } else {
            // Nếu chưa có, thêm mới
            cart.products.push({
                _id: productId,
                name: product.name,
                price: product.price,
                quantity,
                discountPercentage: product.discountPercentage,
                total: discountedPrice * quantity
            });
        }
        product.stock -= quantity;
        await product.save();




        let totalQuantity = cart.products.reduce((sum, item) => sum + item.quantity, 0);
        let totalPrice = cart.products.reduce((sum, item) => sum + item.total, 0);
        let discountTotal = cart.products.reduce((sum, item) => sum + ((item.price * item.discountPercentage / 100) * item.quantity), 0);




        cart.discountTotal = discountTotal;
        cart.totalProduct = cart.products.length;
        cart.totalQuantity = totalQuantity;
        cart.totalPrice = totalPrice;


        console.log("Updated Cart:", cart);


        await cart.save();


        res.status(200).json({
            cart,
            stock: product.stock
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



// ApiRouter.get("/course/:courseId", async (req, res, next) => {
//     try {
//         const courseId = req.params.courseId;

//         const course = await db.Course.findById(courseId)
//             .populate("InstructorId")
//             .populate("list_reviews.user_id")

//         if (!course) {
//             return res.status(404).json({
//                 error: {
//                     status: 404,
//                     message: `CourseId: ${courseId} does not exist`
//                 }
//             });
//         }

//         const formatData = {
//             Title: course.Title,
//             Description: course.Description,
//             Instructor: {
//                 FullName: `${course.InstructorId.FullName.FirstName} ${course.InstructorId.FullName.LastName || ""}`.trim(),
//                 bio: course.InstructorId.bio
//             },
//             Reviews: course.list_reviews.map(l => ({
//                 username: l.user_id.username,
//                 password: l.user_id.password,
//                 reviewtext: l.reviewtext,
//                 rating: l.rating,
//                 reviewDate: l.reviewDate
//             }))
//         }

//         res.status(200).json(formatData)

//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         })
//     }
// });

// // Validate email format
// const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

// // Validate password: >8 ký tự, chứa ít nhất 1 ký tự "_"
// const validatePassword = (password) => password.length > 8 && password.includes("_");
// ApiRouter.put("/course/:courseId/review", async (req, res) => {
//     try {
//         const courseId = req.params.courseId;

//         const { username, email, password, reviewtext, rating } = req.body;

//         // 🟢 Kiểm tra email và password
//         if (!validateEmail(email)) {
//             return res.status(400).json({ message: "Invalid email format" });
//         }
//         if (!validatePassword(password)) {
//             return res.status(400).json({ message: "Password must be > 8 characters and contain at least 1 underscore (_)" });
//         }

//         const course = await db.Course.findById(courseId)
//             .populate("InstructorId")
//             .populate("list_reviews.user_id")
//         if (!course) {
//             return res.status(500).json({
//                 message: `CourseId: ${courseId} does not exist`
//             })
//         }

//         // Kiểm tra username có tồn tại không
//         const user = await db.User.findOne({ username });
//         if (!user) {
//             return res.status(500).json({ message: `UserName: ${username} does not exist` });
//         }

//         const hasReviewed = course.list_reviews.find(review => review.user_id.equals(user._id))
//         if (hasReviewed) {
//             return res.status(500).json({ message: "User has already reviewed this course" })
//         }

//         const newReview = {
//             user_id: user._id,
//             reviewtext,
//             rating,
//             reviewDate: new Date()
//         }

//         course.list_reviews.push(newReview);
//         await course.save();

//         return res.json({
//             message: "Review added successfully.",
//             Title: course.Title,
//             review: {
//                 username: user.username,
//                 reviewtext,
//                 rating,
//                 reviewDate: newReview.reviewDate.toISOString().split("T")[0]
//             }
//         });


//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         })
//     }
// })

// //get
// ApiRouter.get("/student/list", async (req, res) => {
//     try {
//         const student = await db.Student.find()
//             .populate("class")

//         const formatDate = (date) => {
//             const d = new Date(date);
//             const day = String(d.getDate()).padStart(2, '0');  // Thêm số 0 nếu cần
//             const month = String(d.getMonth() + 1).padStart(2, '0'); // Tháng tính từ 0 nên +1
//             const year = d.getFullYear();
//             return `${day}/${month}/${year}`;
//         };
//         const calculateAge = (dob) => {
//             const birthDate = new Date(dob);
//             const today = new Date();
//             let age = today.getFullYear() - birthDate.getFullYear();

//             // Kiểm tra nếu sinh nhật chưa đến trong năm nay thì giảm tuổi đi 1
//             const monthDiff = today.getMonth() - birthDate.getMonth();
//             if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//                 age--;
//             }

//             return age;
//         };
//         const formatData = student.map(s => ({
//             _id: s._id,
//             Code: s.Code,
//             FullName: s.FullName,
//             // Age: calculateAge(s.Dob),
//             Age: new Date().getFullYear() - new Date(s.Dob).getFullYear(), // Tính tuổi đơn giản
//             ClassName: s.class.Name,
//             Subject: s.subjects.map(s => ({
//                 _id: s._id,
//                 Grade: s.Grade
//             }))
//         }))
//         res.status(200).json(formatData);
//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         })
//     }
// })

// //list all movies by genre
// //liet ke tat ca cac phim theo the loai
// ApiRouter.get("/student/:studentCode", async (req, res, next) => {
//     try {
//         const studentCode = req.params.studentCode;

//         const student = await db.Student.findOne({ Code: { $regex: new RegExp(studentCode, "i") } })
//             .populate("class")
//             .populate("subjects.subject")

//         if (!student) {
//             return res.status(404).json({
//                 error: {
//                     status: 404,
//                     message: "This student does not exist"
//                 }
//             });
//         }

//         // Tính CPA
//         const totalCredits = student.subjects.reduce((sum, sub) => sum + (sub.subject?.Credit || 0), 0);
//         const totalGradePoints = student.subjects.reduce((sum, sub) => sum + ((sub.Grade || 0) * (sub.subject?.Credit || 0)), 0);
//         const CPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

//         const formatData = {
//             _id: student._id,
//             Code: student.Code,
//             FullName: student.FullName,
//             Age: new Date().getFullYear() - new Date(student.Dob).getFullYear(), // Tính tuổi đơn giản
//             ClassName: student.class.Name,
//             Subject: student.subjects.map(sub => ({
//                 SubjectName: sub.subject.Name,
//                 Grade: sub.Grade
//             })),
//             CPA: parseFloat(CPA) // Chuyển về số thực
//         }

//         res.status(200).json(formatData)


//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         })
//     }
// });

// //Tổng điểm (Grade) (Grade × Credit) => 8.0×3 + 7.0×2 + 9.0×4 = 24 + 14 + 36=74
// //Tổng số tín chỉ (Credit) => 3 + 2 + 4=9
// //Tính CPA: => 74/9 = 8.22

// // Format lại ngày tháng trước khi trả về
// // const formattedMovies = movie.map(movie => ({
// //     ...movie.toObject(),
// //     release: new Date(movie.release).toLocaleDateString("en-GB").replace(/\//g, "-") // Định dạng dd/mm/yyyy | US: mm/dd/yyyy
// // }));

// // res.status(200).json(formattedMovies)


// //update student by id
// ApiRouter.put("/student/:studentId", async (req, res) => {
//     try {
//         const { studentId } = req.params;
//         const { subjects } = req.body; // Danh sách môn học

//         //  Kiểm tra studentId có tồn tại không
//         const student = await db.Student.findById(studentId);
//         if (!student) {
//             return res.status(404).json({
//                 error: { status: 404, message: "StudentID does not exist" }
//             });
//         }

//         // Cập nhật hoặc thêm môn học
//         for (const newSubject of subjects) {
//             const { subject_id, Grade } = newSubject;

//             // Kiểm tra subject_id có tồn tại trong DB không
//             const subjectExists = await db.Subject.findById(subject_id);
//             if (!subjectExists) {
//                 return res.status(404).json({
//                     error: { status: 404, message: `SubjectID: ${subject_id} does not exist` }
//                 });
//             }

//             // Kiểm tra xem môn học này đã có trong danh sách chưa
//             const existingSubject = student.subjects.find(s => s.subject.equals(subject_id));

//             if (existingSubject) {
//                 // Nếu môn học đã tồn tại → Cập nhật điểm
//                 existingSubject.Grade = Grade;
//             } else {
//                 // Nếu chưa có → Thêm mới vào danh sách
//                 student.subjects.push({ subject: subject_id, Grade });
//             }
//         }

//         // Lưu dữ liệu cập nhật
//         await student.save();

//         // Populate để lấy thông tin đầy đủ về môn học
//         const updatedStudent = await db.Student.findById(studentId)
//             .populate("class")
//             .populate("subjects.subject");

//         res.status(200).json({
//             _id: updatedStudent._id,
//             Code: updatedStudent.Code,
//             FullName: updatedStudent.FullName,
//             ClassName: updatedStudent.class.Name,
//             Subjects: updatedStudent.subjects.map(s => ({
//                 SubjectName: s.subject.Name,
//                 Grade: s.Grade
//             }))
//         });

//     } catch (error) {
//         res.status(500).json({
//             error: { status: 500, message: error.message }
//         });
//     }
// });


// // Create user
// ApiRouter.post("/employees", async (req, res, next) => {
//     try {
//         const { FullName, BasicSalary, Departments, Position } = req.body;
//         const newEmployee = await db.Employee.create({ FullName, BasicSalary, Departments, Position });
//         const savedEmployee = await newEmployee.save();

//         const employee = await db.Employee.findById(savedEmployee._id)
//             .populate("Position")  // Chỉ lấy field 'name' của producer

//         res.status(201).json({
//             _id: employee._id,
//             FullName: employee.FullName,
//             BasicSalary: employee.BasicSalary,
//             TotalSalary: employee.BasicSalary * employee.Position.Coefficient,
//             Departments: employee.Departments,
//             Position: employee.Position.Name,
//         });

//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         })
//     }
// });

// ApiRouter.get("/employees/:minSalary", async (req, res, next) => {
//     try {
//         const minSalary = parseFloat(req.params.minSalary);

//         const employee = await db.Employee.find()
//             .populate("Position")
//             .populate("Departments")

//         const filteredEmployee = employee.filter(emp => {
//             return emp.BasicSalary * emp.Position.Coefficient >= minSalary
//         })

//         const formatData = filteredEmployee.map(e => ({
//             _id: e._id,
//             FullName: e.FullName,
//             BasicSalary: e.BasicSalary,
//             TotalSalary: e.BasicSalary * e.Position.Coefficient,
//             Departments: e.Departments.map(d => d.Name),
//             Position: e.Position.Name
//         }))

//         res.status(200).json(formatData)

//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         })
//     }
// });

// ApiRouter.put("/employees/:id", async (req, res) => {
//     try {
//         const { id } = req.params;

//         const { FullName, BasicSalary, Departments, Position } = req.body;

//         const updatedEmployee = await db.Employee.findByIdAndUpdate(id,
//             { Departments, Position },
//             { new: true }
//         );

//         if (Departments.length > 4) {
//             return res.status(400).json({
//                 error: {
//                     status: 400,
//                     message: "An employee cannot belong to more than 4 departments"
//                 }
//             });
//         }

//         if (!updatedEmployee) {
//             return res.status(404).json({
//                 error: {
//                     status: 404,
//                     message: "Employee not found"
//                 }
//             });
//         }
//         // updatedEmployee.Departments = Departments;
//         // updatedEmployee.Position = Position;

//         // const updateDoc = await updatedEmployee.save();

//         const employees = await db.Employee.findById(updatedEmployee._id)
//             .populate("Position")
//             .populate("Departments")

//         res.status(200).json({
//             _id: employees._id,
//             FullName: employees.FullName,
//             BasicSalary: employees.BasicSalary,
//             TotalSalary: employees.BasicSalary * employees.Position.Coefficient,
//             Departments: employees.Departments.map(d => d.Name),
//             Position: employees.Position.Name
//         });

//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         })
//     }
// })

// ApiRouter.delete("/employees/:id", async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Tìm nhân viên cần xóa
//         const employee = await db.Employee.findById(id).populate("Departments");

//         if (!employee) {
//             return res.status(404).json({ error: "Employee not found." });
//         }

//         // Kiểm tra từng phòng ban mà nhân viên đang thuộc về
//         for (const department of employee.Departments) {
//             const count = await db.Employee.countDocuments({ Departments: department._id });

//             if (count === 1) { // Nếu chỉ còn duy nhất 1 người (chính nhân viên đang xóa)
//                 return res.status(400).json({
//                     error: "Cannot delete the last employee in a department."
//                 });
//             }
//         }

//         // Nếu không vi phạm điều kiện, tiến hành xóa nhân viên
//         await db.Employee.findByIdAndDelete(id);

//         res.status(200).json({ message: "Employee deleted successfully." });

//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         });
//     }
// });

module.exports = ApiRouter;
