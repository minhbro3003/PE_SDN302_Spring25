const mongoose = require('mongoose');
const Customer = require("./customer")
const Product = require("./product")

const orderSchema = new mongoose.Schema({
    totalPrice: { type: Number },
    orderDate: { type: Date, default: Date.now },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", required: true
        },
        name: { type: String, required: true },
        quantity: { type: Number, min: [1, "Quantity must be at least 1"] }
    }]
})

module.exports = mongoose.model('Order', orderSchema)