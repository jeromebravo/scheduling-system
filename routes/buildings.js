var express     = require("express"),
    router      = express.Router(),
    building    = require("../middleware/buildings"),
    Buildings   = require("../models/buildings"),
    Rooms       = require("../models/rooms");

// BUILDINGS INDEX ROUTE
router.get("/", function(req, res){
    Buildings.find({}, function(err, buildings){
        if(err) {
            console.log(err);
        } else {
            res.render("buildings/index", {buildings: buildings});
        }
    });
});

// BUILDINGS NEW ROUTE
router.get("/new", function(req, res){
    res.render("buildings/new");
});

// BUILDINGS CREATE ROUTE
router.post("/", building.newBuildingExist, function(req, res){
    Buildings.create({
        name: req.body.name
    }, function(err, building){
        if(err) {
            console.log(err);
        } else {
            req.flash("success", "Successfuly added!");
            res.redirect("/buildings");
        }
    })
});

// BUILDINGS SHOW ROUTE
// VIEW ROOMS
router.get("/:id", async function(req, res){
    try {
        var building = await Buildings.findById(req.params.id).populate("rooms");
        res.render("buildings/show", {building: building});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// BUILDINGS EDIT ROUTE
router.get("/:id/edit", async function(req, res){
    try {
        var building = await Buildings.findById(req.params.id);
        res.render("buildings/edit", {building: building});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// BUILDINGS UPDATE ROUTE
router.put("/:id", building.exist, function(req, res){
    Buildings.findByIdAndUpdate(req.params.id, {
        name: req.body.name
    }, function(err, updated){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect("/buildings");
        } else {
            Rooms.updateMany({building: updated.name}, {$set: {building: req.body.name}}, function(err, roomsUpdated){
                if(err) {
                    req.flash("error", "Something went wrong");
                    res.redirect("/buildings");
                } else {
                    req.flash("success", "Updated!");
                    res.redirect("/buildings");
                }
            });  
        }
    });
});

// BUILDINGS DESTROY ROUTE
router.delete("/:id", function(req, res){
    Buildings.findByIdAndRemove(req.params.id, function(err, deleted){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect("/buildings");
        } else {
            Rooms.deleteMany({building: deleted.name}, function(err, roomsDeleted){
                if(err) {
                    req.flash("error", "Something went wrong");
                    res.redirect("/buildings");
                } else {
                    req.flash("success", "Deleted!");
                    res.redirect("/buildings");
                }
            });
        }
    });
});

module.exports = router;