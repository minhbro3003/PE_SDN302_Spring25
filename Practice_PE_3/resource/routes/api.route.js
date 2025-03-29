const express = require("express");
const db = require("../models");


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


// //list all movies by genre 
// //liet ke tat ca cac phim theo the loai 
// ApiRouter.get("/by-genre/:genre", async (req, res, next) => {
//     try {
//         const genre = req.params.genre;

//         const movie = await db.Movie.find({ genres: { $regex: new RegExp(genre, "i") } }).select("-__v -createdAt -updatedAt")
//             .populate("producer", "-_id name")
//             .populate("director", "-_id fullname")
//             .populate("stars", "-_id fullname")

//         if (movie.length === 0) {
//             return res.status(404).json({
//                 error: {
//                     status: 404,
//                     message: "This movie genre does not exist"
//                 }
//             });
//         }
//         const formatMovie = movie.map((m) => ({
//             _id: m._id,
//             title: m.title,
//             release: m.release,
//             description: m.description,
//             producer: m.producer.name,
//             director: m.director.fullname,
//             genres: m.genres,
//             stars: m.stars.map((s) => s.fullname)
//         }))

//         res.status(200).json(formatMovie)

//         // Format lại ngày tháng trước khi trả về
//         // const formattedMovies = movie.map(movie => ({
//         //     ...movie.toObject(),
//         //     release: new Date(movie.release).toLocaleDateString("en-GB").replace(/\//g, "-") // Định dạng dd/mm/yyyy | US: mm/dd/yyyy
//         // }));

//         // res.status(200).json(formattedMovies)
//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         })
//     }
// });

// //Statistics of the number of movies by producer name 
// //thong ke so luong phim theo ten nha san xuat 
// ApiRouter.get("/count-by-producer/:producerName", async (req, res, next) => {
//     try {
//         const producerName = req.params.producerName;

//         // Tìm ID của nhà sản xuất theo tên
//         const producer = await db.Producer.findOne({ name: producerName });

//         if (!producer) {
//             return res.status(404).json({
//                 error: {
//                     status: 404,
//                     message: "This producer name does not exist"
//                 }
//             });
//         }

//         // Đếm số lượng phim có producer này
//         const numberOfMovie = await db.Movie.countDocuments({ producer: producer._id });

//         res.status(200).json({
//             producer: producerName,
//             numberOfMovie: numberOfMovie
//         });
//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         });
//     }
// });

// // Xóa Diễn Viên khỏi Bộ Phim 
// //remove a star from the corresponding movie according to _id 
// ApiRouter.put("/:movieId/remove-star/:starId", async (req, res, next) => {
//     try {
//         const { movieId, starId } = req.params;

//         // kiem tra id ton tai khong 
//         const movie = await db.Movie.findById(movieId);

//         if (!movie) {
//             return res.status(404).json({
//                 error: {
//                     status: 404,
//                     message: "This movie does not exist"
//                 }
//             });
//         }

//         //kiem tra xem star co trong danh sach ko 
//         if (!movie.stars.includes(starId)) {
//             return res.status(404).json({
//                 error: {
//                     status: 404,
//                     message: "This star does not exist in this movie"
//                 }
//             });
//         }

//         //xoa khoi danh sach 
//         await db.Movie.findByIdAndUpdate(movieId, {
//             $pull: { stars: starId }
//         })

//         // 🛠️ Load lại dữ liệu sau khi cập nhật
//         const updatedMovie = await db.Movie.findById(movieId)

//         res.status(200).json(updatedMovie);
//     } catch (error) {
//         res.status(500).json({
//             error: {
//                 status: 500,
//                 message: error.message
//             }
//         });
//     }
// });

// ApiRouter.put("/:movieId/add-stars", async (req, res, next) => {
//     try {
//         const { movieId } = req.params;
//         const stars = req.body;
//         const movie = await db.Movie.findById(movieId);
//         const newStar = stars.filter(starId => !movie.stars.includes(starId));

//         movie.stars.push(...newStar);
//         await movie.save();
//         res.status(200).json(
//             movie
//         );

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
