const Category = require("./category");
const Product = require("./product");
const Customer = require("./customer");
const Order = require("./order");
const Cart = require("./cart");
const db = {
    Category,
    Product,
    Customer,
    Order,
    Cart,
};

module.exports = db;
