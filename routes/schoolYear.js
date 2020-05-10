var express     = require("express"),
    router      = express.Router(),
    schoolYear  = require("../middleware/schoolYear");
    SchoolYear  = require("../models/schoolYear"),
    Teachers    = require("../models/teachers"),
    Rooms       = require("../models/rooms");

// SCHOOL YEAR INDEX ROUTE
router.get("/", function(req, res){
    SchoolYear.find({}).sort("-created").exec(function(err, schoolYear){
        if(err) {
            console.log(err);
        } else {
            res.render("schoolYear/index", {schoolYears: schoolYear});
        }
    });
});

// SCHOOL YEAR NEW ROUTE
router.get("/new", function(req, res){
    res.render("schoolYear/new");
});

// SCHOOL YEAR CREATE ROUTE
router.post("/", schoolYear.exist, async function(req, res){
    var schoolYear = await SchoolYear.create({schoolYear: req.body.sy});
    
    await Teachers.updateMany({}, 
        {
            $push: {
                schedule: [
                    {
                        schoolYear: schoolYear.schoolYear,
                        schedule: [{}]
                    }
                ]
            }
        });
    
    await Rooms.updateMany({}, 
        {
            $push: {
                schedule: [
                    {
                        schoolYear: schoolYear.schoolYear,
                        schedule: [{}]
                    }
                ]
            }
        });

    req.flash("success", "Successfuly added!");
    res.redirect("/schoolYear");
});

// SCHOOL YEAR DELETE ROUTE
router.delete("/:id", function(req, res){
    SchoolYear.findByIdAndRemove(req.params.id, function(err){
        if(err) {
            console.log(err);
        } else {
            req.flash("success", "Deleted!");
            res.redirect("/schoolYear");
        }
    });
});

module.exports = router;