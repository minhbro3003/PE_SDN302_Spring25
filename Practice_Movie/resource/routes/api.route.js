const express = require("express");
const db = require("../models");
const bcrypt = require("bcryptjs");

const ApiRouter = express.Router();

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

//update movie


module.exports = ApiRouter;
