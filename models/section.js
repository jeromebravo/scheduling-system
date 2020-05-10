var mongoose = require("mongoose");

var sectionSchema = new mongoose.Schema({
    grade: String,
    section: String,
    schoolYear: String,
    schedule: [
        {
            subject: String,
            timeIn: {type: String, default: "07:00"},
            timeOut: {type: String, default: "07:00"},
            teacher: String,
            room: String
        }
    ]
});

module.exports = mongoose.model("Section", sectionSchema);