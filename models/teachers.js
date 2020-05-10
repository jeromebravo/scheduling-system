var mongoose = require("mongoose");

var teachersSchema = new mongoose.Schema({
    name: String,
    hours: Number,
    minutes: Number,
    grades: [],
    subjects: [],
    schedule: [
        {
            schoolYear: String,
            schedule: [
                {
                    section: String,
                    subject: String,
                    timeIn: {type: String, default: "07:00"},
                    timeOut: {type: String, default: "07:00"},
                    room: String
                }
            ]
        }
    ]
});

module.exports = mongoose.model("Teacher", teachersSchema);