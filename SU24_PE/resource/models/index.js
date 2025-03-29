const mongoose = require("mongoose");
const Movie = require("./movie");
const Star = require("./star");
const Producer = require("./producer");
const Director = require("./director");

const db = {}

// Define schema
db.Movie = Movie;
db.Star = Star;
db.Producer = Producer;
db.Director = Director;



module.exports = db;