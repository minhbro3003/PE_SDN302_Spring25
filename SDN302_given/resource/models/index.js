const mongoose = require("mongoose");
const Book = require("./books");
const Category = require("./category");
const User = require("./user");
const BorrowRecord = require("./borrowrecord");

const db = { Book, Category, BorrowRecord, User }

module.exports = db;