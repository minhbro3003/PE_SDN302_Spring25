const express = require("express");
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ApiRouter = express.Router();

//
ApiRouter.get("/books", async (req, res) => {
    try {
        const books = await db.Book.find().select("-__v")
            .populate("categoryId", "-description");

        res.status(200).json(books)
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})

//borrowRecords/user
ApiRouter.get("/borrowRecords/user/:userId", async (req, res) => {
    try {
        const borrowRecord = await db.BorrowRecord.find({ userId: req.params.userId }).select("-userId")
            .populate("books.bookId",)
        // .populate("userId", "-password");

        const formatData = borrowRecord.map(bo => ({
            _id: bo._id,
            borrowDate: bo.borrowDate,
            books: bo.books.map(b => ({
                _id: b.bookId._id,
                title: b.bookId.title,
                author: b.bookId.author
            }))
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
})

//borrowRecords
ApiRouter.get("/borrowRecords/:recordId", async (req, res) => {
    try {
        const borrowRecord = await db.BorrowRecord.findById(req.params.recordId).select("-userId")
            .populate("books.bookId",)
            .populate("userId", "-password");

        const formatData = ({
            _id: borrowRecord._id,
            borrowDate: borrowRecord.borrowDate,
            user: {
                _id: borrowRecord.userId._id,
                name: borrowRecord.userId.name,
                email: borrowRecord.userId.email
            },
            books: borrowRecord.books.map(b => ({
                _id: b.bookId._id,
                title: b.bookId.title,
                author: b.bookId.author,
                quantity: b.quantity,
                // status: b.bookId.status

            }))
        })
        res.status(200).json(formatData)
    } catch (error) {
        res.status(500).json({
            error: {
                status: 500,
                message: error.message
            }
        })
    }
})

// Post /borrowRecord/create
ApiRouter.post("/borrowRecord/create", async (req, res) => {
    try {
        const { userId, books } = req.body;
        const newBorrow = new db.BorrowRecord({
            userId,
            books,
            borrowDate: Date.now()
        });

        const borrowRecord = await newBorrow.save();

        res.status(201).json(borrowRecord);

    } catch (error) {
        console.log(error)
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

//login
ApiRouter.post("/users/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await db.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const accessToken = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            token: accessToken,
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

//check authorization
ApiRouter.get("/users/profile", authenticateToken, async (req, res) => {
    try {
        const user = await db.User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            address: user.address,
            phone: user.phone

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
