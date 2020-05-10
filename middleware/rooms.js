var Rooms     = require("../models/rooms"),
    Buildings = require("../models/buildings");

var room = {};

// CHECK IF ROOM ALREADY EXIST
// POST REQUEST
room.newRoomExist = function(req, res, next){
    Buildings.findById(req.params.id, function(err, foundBuilding){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`/buildings/${req.params.id}`);
        } else {
            Rooms.find({building: foundBuilding.name, roomNumber: req.body.roomNumber}, function(err, foundRoom){
                if(err) {
                    req.flash("error", "Something went wrong");
                    res.redirect(`/buildings/${req.params.id}`);
                } else {
                    if(foundRoom.length === 0) {
                        next();
                    } else {
                        req.flash("error", "Room already exist");
                        res.redirect(`/buildings/${req.params.id}`);
                    }
                }
            });
        }
    });
}

// CHECK IF GRADE IS EMPTY
room.gradeIsEmpty = function(req, res, next){
    Rooms.findById(req.params.roomId, function(err, foundRoom){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`/buildings/${req.params.id}`);
        } else {
            if(foundRoom.grades.length > 0) {
                next();
            } else {
                req.flash("error", "Add a grade");
                res.redirect(`/buildings/${req.params.id}/${req.params.roomId}/edit`);
            }
        }
    });
}

// CHECK IF GRADE IS ALREADY IN DATABASE
room.gradeExist = function(req, res, next){
    Rooms.findById(req.params.roomId, function(err, foundRoom){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`/buildings/${req.params.id}`);
        } else {
            if(!foundRoom.grades.includes(req.body.grade)) {
                next();
            } else {
                req.flash("error", "Grade is already in the list");
                res.redirect(`/buildings/${req.params.id}/${req.params.roomId}/edit`);
            }
        }
    });
}

// CHECK IF ROOM ALREADY EXIST
// PUT REQUEST
room.roomExist = function(req, res, next){
    Buildings.findById(req.params.id, function(err, foundBuilding){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`/buildings/${req.params.id}`);
        } else {
            Rooms.find({_id: {$ne: req.params.roomId}, building: foundBuilding.name, roomNumber: req.body.roomNumber}, function(err, foundRoom){
                if(err) {
                    req.flash("error", "Something went wrong");
                    res.redirect(`/buildings/${req.params.id}`);
                } else {
                    if(foundRoom.length === 0) {
                        next();
                    } else {
                        req.flash("error", "Room already exist");
                        res.redirect(`/buildings/${req.params.id}`);
                    }
                }
            });
        }
    });
}

module.exports = room;