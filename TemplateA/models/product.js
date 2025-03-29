const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPercentage: { type: Number, required: true },
    stock: { type: Number, required: true },
    brand: { type: String, required: true },
    thumbnail: { type: String, required: true },
    images: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "image", required: true
        },
        url: { type: String, required: true },
        caption: { type: String, required: true },
    }],
    comments: [{ type: String }],
});

module.exports = mongoose.model("product", productSchema);