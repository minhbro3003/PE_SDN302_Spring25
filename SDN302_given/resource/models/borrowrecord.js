const mongoose = require('mongoose');

const borrowrecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    books: [{
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "book",
        },
        quantity: { type: Number, }
    }],
    borrowDate: { type: Date, default: Date.now },
})

module.exports = mongoose.model('borrowrecord', borrowrecordSchema)