var Buildings = require("../models/buildings");

var building = {};

// CHECK IF BUILDING ALREADY EXIST
// POST REQUEST
building.newBuildingExist = function(req, res, next){
    Buildings.find({name: req.body.name}, function(err, foundBuilding){
        if(err) {
            console.log(err);
        } else {
            if(foundBuilding.length === 0) {
                next();
            } else {
                req.flash("error", "Building already exist");
                res.redirect("/buildings");
            }
        }
    });
}

// CHECK IF BUILDING ALREADY EXIST
// PUT REQUEST
building.exist = function(req, res, next){
    Buildings.find({name: req.body.name, _id: {$ne: req.params.id}}, function(err, foundBuilding){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect("/buildings");
        } else {
            if(foundBuilding.length === 0) {
                next();
            } else {
                req.flash("error", "Building already exist");
                res.redirect("/buildings");
            }
        }
    });
}

module.exports = building;