const mongoose = require('mongoose');
const Category = require("./category")
const productSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Name is required"] },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }
})

module.exports = mongoose.model('Product', productSchema)