const mongoose = require('mongoose');

const producerSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Name is required"] },
}, { timestamps: true })

module.exports = mongoose.model('producer', producerSchema)