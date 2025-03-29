const express = require('express');
const db = require('../model')

const ApiRouter = express.Router();

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

//update a new comment 
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


module.exports = ApiRouter;