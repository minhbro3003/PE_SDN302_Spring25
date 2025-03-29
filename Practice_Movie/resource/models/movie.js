const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
    title: { type: String, required: [true, "The movie title is required"], unique: true },
    release: { type: Date, required: [true, "Date is required"] },
    description: { type: String, required: [true, "Name is required"] },
    producer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "producer",
        required: true
    },
    director: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "director",
        required: true
    },

    genres: [{
        type: String, required: true,
        enum: {
            values: ["Comedy", "Action", "Drama", "Cartoon"],
            message: "{VALUE} is not supported"
        }
    }],
    //
    stars: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "star",
        required: true
    }],


}, { timestamps: true });

module.exports = mongoose.model("movie", movieSchema);
