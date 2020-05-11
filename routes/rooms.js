var express     = require("express"),
    router      = express.Router(),
    room        = require("../middleware/rooms"),
    Rooms       = require("../models/rooms"),
    Buildings   = require("../models/buildings"),
    SchoolYear  = require("../models/schoolYear");

var grades = [];

// ROOMS NEW ROUTE
router.get("/:id/new", async function(req, res){
    try {
        await Buildings.findById(req.params.id);
        res.render("rooms/new", {id: req.params.id, grades: grades});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// SEARCH ROOM
router.post("/:id/search", async function(req, res){
    try {
        var building = await Buildings.findById(req.params.id);
        var rooms = await Rooms.find({building: building.name, roomNumber: req.body.room});

        if(rooms.length === 0) {
            req.flash("error", "Room not found");
            return res.redirect(`/buildings/${req.params.id}`);
        }

        res.render("buildings/show", {building: building, rooms: rooms});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// ADD ONE GRADE IN ARRAY
router.post("/:id/new", gradeExist, function(req, res){
    grades.push(req.body.grade);
    res.redirect(`/buildings/${req.params.id}/new`);
});

// DELETE ONE GRADE IN ARRAY
router.delete("/:id/new/:grade", function(req, res){
    var index = grades.indexOf(req.params.grade);
    grades.splice(index, 1);
    res.redirect(`/buildings/${req.params.id}/new`);
});

// ROOMS CREATE ROUTE
router.post("/:id", isEmpty, room.newRoomExist, function(req, res){
    SchoolYear.findOne({}).sort("-created").exec(function(err, schoolYear){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`buildings/${req.params.id}`);
        } else {
            if(schoolYear !== null) {
                Buildings.findById(req.params.id, function(err, foundBuilding){
                    if(err) {
                        req.flash("error", "Something went wrong");
                        res.redirect(`/buildings/${req.params.id}`);
                    } else {
                        Rooms.create({
                            building: foundBuilding.name,
                            roomNumber: req.body.roomNumber,
                            grades: grades,
                            schedule: [
                                {
                                    schoolYear: schoolYear.schoolYear,
                                    schedule: [{}]
                                }
                            ]
                        }, function(err, room){
                            if(err) {
                                console.log(err);
                            } else {
                                grades = [];
                                foundBuilding.rooms.push(room);
                                foundBuilding.save();
                                req.flash("success", "Successfuly added!");
                                res.redirect(`/buildings/${req.params.id}`);
                            }
                        });
                    }
                });
            } else {
                req.flash("error", "Add a school year");
                res.redirect("/schoolYear");
            }
        }
    });
});

// ROOMS SHOW ROUTE
router.get("/:id/:roomId", async function(req, res){
    try {
        await Buildings.findById(req.params.id);
        var room = await Rooms.findById(req.params.roomId);
        res.render("rooms/show", {id: req.params.id, room: room});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// ROOMS  EDIT ROUTE
router.get("/:id/:roomId/edit", async function(req, res){
    try {
        await Buildings.findById(req.params.id);
        var room = await Rooms.findById(req.params.roomId);
        res.render("rooms/edit", {id: req.params.id, room: room});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// ADD ONE GRADE IN DATABASE
router.post("/:id/:roomId/edit", room.gradeExist, function(req ,res){
    Rooms.findById(req.params.roomId, function(err, foundRoom){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`/buildings/${req.params.id}`);
        } else {
            foundRoom.grades.push(req.body.grade);
            foundRoom.save();
            res.redirect(`/buildings/${req.params.id}/${req.params.roomId}/edit`);
        }
    });
});

// DELETE ONE GRADE IN DATABASE
router.delete("/:id/:roomId/edit/:grade", function(req, res){
    Rooms.updateOne({_id: req.params.roomId}, {$pull: {grades: {$in: [req.params.grade]}}}, {safe: true, multi: true}, function(err, deleted){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`/buildings/${req.params.id}`);
        } else {
            res.redirect(`/buildings/${req.params.id}/${req.params.roomId}/edit`);
        }
    });
});

// ROOMS UPDATE ROUTE
router.put("/:id/:roomId", room.gradeIsEmpty, room.roomExist, function(req, res){
    Rooms.findByIdAndUpdate(req.params.roomId, {roomNumber: req.body.roomNumber}, function(err, updated){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`/buildings/${req.params.id}`);
        } else {
            req.flash("success", "Updated!");
            res.redirect(`/buildings/${req.params.id}`);
        }
    });
});

// ROOMS DESTROY ROUTE
router.delete("/:id/:roomId", function(req, res){
    Rooms.findByIdAndRemove(req.params.roomId, function(err, deleted){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`/buildings/${req.params.id}`);
        } else {
            req.flash("success", "Deleted!");
            res.redirect(`/buildings/${req.params.id}`);
        }
    });
});

// =============================
// MIDDLEWARE
// =============================

// CHECK IF GRADE IS EMPTY
function isEmpty(req, res, next){
    if(grades.length > 0){
        next();
    } else {
        req.flash("error", "Add a grade");
        res.redirect(`/buildings/${req.params.id}/new`);
    }
}   

// CHECK IF GRADE IS ALREADY IN THE LIST
function gradeExist(req, res, next){
    if(!grades.includes(req.body.grade)){
        next();
    } else {
        req.flash("error", "Grade is already in the list");
        res.redirect(`/buildings/${req.params.id}/new`);
    }
}

module.exports = router;