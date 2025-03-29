const express = require("express");
const db = require("../models");


const ApiRouter = express.Router();

// Create user
ApiRouter.post("/create", async (req, res, next) => {
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

module.exports = ApiRouter;
