var mongoose = require("mongoose");

var sySchema = new mongoose.Schema({
    schoolYear: String,
    created: {type: Date, default: Date.now}
});

module.exports = mongoose.model("SchoolYear", sySchema);