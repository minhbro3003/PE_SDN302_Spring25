const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },//du lieu ko trung lap
    description: { type: String, required: true }
})

module.exports = mongoose.model('category', categorySchema)