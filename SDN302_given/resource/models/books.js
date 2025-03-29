const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category"
    }
})

module.exports = mongoose.model('book', bookSchema)