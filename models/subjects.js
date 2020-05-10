var mongoose = require("mongoose");

var subjectsSchema = new mongoose.Schema({
    grade: String,
    subjects: [
        {
            name: String,
            minutes: Number
        }
    ]
});

module.exports = mongoose.model("Subject", subjectsSchema);