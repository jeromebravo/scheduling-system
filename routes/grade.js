var express     = require("express"),
    router      = express.Router(),
    subject     = require("../middleware/subjects"),
    Subjects    = require("../models/subjects"),
    Section     = require("../models/section");

var subjectList = [];

// GRADE INDEX ROUTE
router.get("/", function(req, res){
    Subjects.find({}, function(err, subjects){
        if(err) {
            console.log(err);
        } else {
            res.render("grade/index", {subjects: subjects});
        }
    });
});

// SEARCH GRADE
router.post("/search", async function(req ,res){
    var subjects = await Subjects.find({grade: req.body.grade});

    if(subjects.length === 0) {
        req.flash("error", "Grade not found");
        return res.redirect("/grade");
    }

    res.render("grade/index", {subjects: subjects});
});

// GRADE NEW ROUTE
router.get("/new", function(req, res){
    res.render("grade/new", {subjects: subjectList});
});

// ADD SUBJECT IN ARRAY
router.post("/new", subjectExistInArray, function(req, res){
    var newSubject = req.body.subject;
    subjectList.push(newSubject);
    res.redirect("/grade/new");
});

// DELETE ONE SUBJECT IN ARRAY
// REGISTRATION FORM
router.delete("/new/:name", function(req, res){
    var removeSubject = req.params.name;
    console.log(removeSubject);
    
    subjectList = subjectList.filter(function(obj){
        return obj.name !== removeSubject;
    });

    res.redirect("/grade/new");
});

// GRADE CREATE ROUTE
// INSERT SUBJECTS IN DATABASE
router.post("/", isEmpty, subject.newGradeExist, function(req, res){
    Subjects.create({
        grade: req.body.grade,
        subjects: subjectList
    }, function(err, subject){
        if(err) {
            console.log(err);
        } else {
            req.flash("success", "Successfuly added!");
            subjectList = [];
            res.redirect("/grade");
        }
    })
});

// GRADE SHOW ROUTE
router.get("/:id", async function(req, res){
    try {
        var grade = await Subjects.findById(req.params.id);
        res.render("grade/show", {grade: grade});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// VIEW SECTION SCHEDULE
router.get("/:id", async function(req, res){
    var section = await Section.findById(req.params.sectionId);
    res.render("grade/section", {section: section});
});

// GRADE EDIT ROUTE
router.get("/:id/edit", async function(req, res){
    try {
        var subjects = await Subjects.findById(req.params.id);
        res.render("grade/edit", {subjects: subjects, id: req.params.id});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// ADD ONE SUBJECT IN DATABASE
// UPDATE FORM
router.post("/:id/edit", subject.existInDB, function(req, res){
    Subjects.findById(req.params.id, function(err, foundGrade){
        if(err) {
            console.log(err);
        } else {
            foundGrade.subjects.push(req.body.subject);
            foundGrade.save();
            res.redirect(`/grade/${req.params.id}/edit`);
        }
    });
});

// DELETE ONE SUBJECT IN DATABASE
// UPDATE FORM
router.delete("/:id/edit/:name", function(req, res){
    Subjects.updateOne({_id: req.params.id}, {$pull: {subjects: {name: req.params.name}}}, {safe: true, multi: true}, function(err, obj){
        if(err) {
            console.log(err);
        } else {
            console.log(obj);
            res.redirect("/grade/" + req.params.id + "/edit");
        }
    });
});

// GRADE UPDATE ROUTE
router.put("/:id", subject.noSubject, subject.gradeExist, function(req, res){
    Subjects.findByIdAndUpdate(req.params.id, {grade: req.body.grade}, function(err, result){
        if(err) {
            console.log(err);
        } else {
            req.flash("success", "Updated!");
            res.redirect("/grade");
        }
    });
});

// GRADE DELETE ROUTE
// DELETE GRADE AND ITS SUBJECTS IN DATABASE
router.delete("/:id", function(req, res){
    Subjects.findByIdAndRemove(req.params.id, function(err, deleted){
        if(err) {
            console.log(err);
        } else {
            req.flash("success", "Deleted!");
            res.redirect("/grade");
        }
    });
});

// =============================
// MIDDLEWARE
// =============================

// CHECK IF subjectList IS EMPTY
function isEmpty(req, res, next){
    if(subjectList.length > 0) {
        next();
    } else {
        req.flash("error", "Add a subject");
        res.redirect("/grade/new");
    }   
}

// CHECK IF SUBJECT IS ALREADY IN subjectList
function subjectExistInArray(req, res, next){
    if(!subjectList.some(s => s.name === req.body.subject.name)) {
        next();
    } else {
        req.flash("error", "Subject is already in the list");
        res.redirect("/grade/new");
    }
}

module.exports = router;