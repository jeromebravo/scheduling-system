var SchoolYear = require("../models/schoolYear");

var schoolYear = {};

// CHECK IF SCHOOL YEAR IS ALREADY EXIST
schoolYear.exist = function(req, res, next){
    SchoolYear.find({schoolYear: req.body.sy}, function(err, schoolYear){
        if(err) {
            console.log(err);
        } else {
            if(schoolYear.length === 0) {
                next();
            } else {
                req.flash("error", "School year already exist");
                res.redirect("/schoolYear/new");
            }
        }
    });
}

module.exports = schoolYear;