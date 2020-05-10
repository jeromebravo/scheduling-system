var mongoose = require("mongoose");

var roomsSchema = new mongoose.Schema({
    building: String,
    roomNumber: String,
    grades: [],
    schedule: [
        {
            schoolYear: String,
            schedule: [
                {
                    section: String,
                    subject: String,
                    timeIn: {type: String, default: "07:00"},
                    timeOut: {type: String, default: "07:00"},
                    teacher: String
                }
            ]
        }
    ]
});

module.exports = mongoose.model("Room", roomsSchema);