const mongoose = require("mongoose");
const Categories = require("./categories.model");
const Comments = require("./comments.model");
const Tutorials = require("./tutorials.model");
const Images = require("./images.model");
const db = {}

// Define schema
db.Categories = Categories;

db.Comments = Comments;

db.Tutorials = Tutorials;

db.Images = Images;

module.exports = db;