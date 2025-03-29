const mongoose = require("mongoose");
const Comment = require("./comment");
const Image = require("./image");
const Product = require("./product");
const User = require("./user")
const Cart = require("./cart")

const db = {}

// Define schema
db.Comment = Comment;
db.Image = Image;
db.Product = Product;
db.User = User;
db.Cart = Cart

module.exports = db;