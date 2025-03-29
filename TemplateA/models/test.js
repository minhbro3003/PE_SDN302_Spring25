const mongoose = require("mongoose");

//mau
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: [true, "Name is required"], unique: true },//du lieu ko trung lap
    description: { type: String, required: true }
})

module.exports = mongoose.model('Category', categorySchema)


//mau id
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Name is required"] },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)

///
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    discountTotal: { type: Number, required: true },
    totalProduct: { type: Number, required: true },
    totalQuantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    products: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product", required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        discountPercentage: { type: Number, required: true },
        total: { type: Number, required: true },
    }],
    images: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "image", required: true,
        },
        url: { type: String, required: true },
        caption: { type: String, required: true },
    }],
});

module.exports = mongoose.model("cart", cartSchema);
// Define schema
const userSchema = new mongoose.Schema({
    gmail: { type: String, required: [true, "Gmail is required"], unique: true },
    password: { type: String, required: [true, "Password is required"] },
    name: { type: String, required: [true, "Name is required"] },
    phone: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be 10 digits"]
    },
    age: {
        type: Number,
        min: [18, 'it nhat 18 t'],
        max: 50
    },
    address: { type: String, required: [true, "Address is required"] },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    createdAt: { type: Date, default: Date.now },

    email: {
        type: String, required: true, unique: true,
        match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"]
    },

    //
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


    //
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", required: true
        },
        name: { type: String, required: true },
        quantity: { type: Number, min: [1, "Quantity must be at least 1"] }
    }],

    //
    producer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "producer",
        required: true
    },


}, { timestamps: true });


module.exports = mongoose.model("user", userSchema);
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

//hash password trước khi lưu vào database 
const bcrypt = require("bcryptjs");

const customerSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Name is required"] },
    email: {
        type: String,
        unique: true,
        validate: {
            validator: function (v) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        },
        required: [true, 'Email is required']
    },
    password: { type: String, required: [true, "Password is required"] },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^\d{10}$/, "Phone number must be 10 digits"]
    },
    // role: { type: String, enum: ["customer", "admin"], default: "customer" },
    role: { type: Boolean, default: false },
    addresses: [
        {
            street: String,
            city: String,
            state: String,
            country: String,
        }
    ],

}, { timestamps: true });

customerSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

module.exports = mongoose.model('Customer', customerSchema);