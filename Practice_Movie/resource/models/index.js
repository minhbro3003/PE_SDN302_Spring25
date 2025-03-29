const mongoose = require("mongoose");
const Director = require("./director");
const Movie = require("./movie");
const Producer = require("./producer");
const Star = require("./star");

const db = {}

// Define schema
db.Director = Director;
db.Movie = Movie;
db.Producer = Producer;
db.Star = Star;

module.exports = db;