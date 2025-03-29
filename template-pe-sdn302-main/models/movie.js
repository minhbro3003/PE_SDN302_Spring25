const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
    title: { type: String, required: [true, "The movie title is required"] },
    release: { type: Date, required: true },
    description: { type: String, required: true },
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
    stars: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "star",
        required: true
    }],
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", required: true
        },
        name: { type: String, required: true },
        quantity: { type: Number, min: [1, "Quantity must be at least 1"] }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model("movie", movieSchema);

// {
//     "error": {
//         "status": 500,
//             "message": "movie validation failed: genres.0: Comed 1 is not supported, genres.1: Action 2 is not supported"
//     }
// }

// {
//     "error": {
//         "status": 500,
//             "message": "movie validation failed: title: The movie title is required"
//     }
// }
