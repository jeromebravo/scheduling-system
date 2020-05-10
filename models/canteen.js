var mongoose = require("mongoose");

var canteenSchema = new mongoose.Schema({
    timeIn: String,
    timeOut: String,
    numberOfSections: Number,
    schoolYear: String
});

module.exports = mongoose.model("Canteen", canteenSchema);