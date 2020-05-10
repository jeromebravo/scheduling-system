var mongoose = require("mongoose");

var buildingsSchema = new mongoose.Schema({
    name: String,
    rooms: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room"
        }
    ]
});

module.exports = mongoose.model("Building", buildingsSchema);