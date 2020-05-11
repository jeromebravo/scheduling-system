var express     = require("express"),
    router      = express.Router(),
    teacher     = require("../middleware/teachers"),
    SchoolYear  = require("../models/schoolYear"),
    Teachers    = require("../models/teachers");

var grades   = [],
    subjects = [];

// TEACHERS INDEX ROUTE
router.get("/", function(req, res){
    Teachers.find({}, function(err, teachers){
        if(err) {
            console.log(err);
        } else {
            res.render("teachers/index", {teachers: teachers});
        }
    });
});

// SEARCH TEACHER
router.post("/search", async function(req, res){
    var teachers = await Teachers.find({name: req.body.name});

    if(teachers.length === 0) {
        req.flash("error", "No teacher found");
        return res.redirect("/teachers");
    }

    res.render("teachers/index", {teachers: teachers});
});

// TEACHERS NEW ROUTE
router.get("/new", function(req ,res){
    res.render("teachers/new", {grades: grades, subjects: subjects});
});

// ADD GRADE IN ARRAY
router.post("/new/grade", gradeExist, function(req, res){
    grades.push(req.body.grade);
    console.log(grades);
    res.redirect("/teachers/new");
});

// DELETE GRADE IN ARRAY
router.delete("/new/grade/:grade", function(req, res){
    var index = grades.indexOf(req.params.grade);
    grades.splice(index, 1);
    res.redirect("/teachers/new");
});

// ADD SUBJECT IN ARRAY
router.post("/new/subject", subjectExist, function(req, res){
    subjects.push(req.body.subject);
    console.log(subjects);
    res.redirect("/teachers/new");
});

// DELETE SUBJECT IN ARRAY
router.delete("/new/subject/:subject", function(req, res){
    var index = subjects.indexOf(req.params.subject);
    subjects.splice(index, 1);
    res.redirect("/teachers/new");
});

// TEACHERS CREATE ROUTE
// INSERT TEACHER IN DATABASE
router.post("/", isGradeEmpty, isSubjectEmpty, function(req, res){
    SchoolYear.findOne({}).sort("-created").exec(function(err, schoolYear){
        if(err) {
            console.log("error");
        } else {
            if(schoolYear !== null) {
                Teachers.create({
                    name: req.body.name,
                    hours: req.body.hours,
                    minutes: req.body.hours * 60,
                    grades: grades,
                    subjects: subjects,
                    schedule: [
                        {
                            schoolYear: schoolYear.schoolYear,
                            schedule: [{}]
                        }
                    ]
                }, function(err, teacher){
                    if(err) {
                        console.log(err);
                    } else {
                        grades = [];
                        subjects = [];
                        req.flash("success", "Successfuly added!");
                        res.redirect("/teachers");
                    }
                });
            } else {
                req.flash("error", "Add a school year");
                res.redirect("/schoolYear");
            }
        }
    });
});

// TEACHERS SHOW ROUTE
router.get("/:id", async function(req, res){
    try {
        var teacher = await Teachers.findById(req.params.id);
        res.render("teachers/show", {teacher: teacher});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// TEACHERS EDIT ROUTE
router.get("/:id/edit", async function(req ,res){
    try {
        var teacher = await Teachers.findById(req.params.id);
        res.render("teachers/edit", {teacher: teacher});
    } catch {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});

// ADD ONE GRADE IN DATABASE
router.post("/:id/edit/grade", teacher.gradeExist, function(req, res){
    Teachers.findById(req.params.id, function(err, teacher){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect("/teachers");
        } else {
            teacher.grades.push(req.body.grade);
            teacher.save();
            res.redirect(`/teachers/${req.params.id}/edit`);
        }
    });
});

// DELETE ONE GRADE IN DATABASE
router.delete("/:id/edit/grade/:grade", function(req, res){
    Teachers.updateOne({_id: req.params.id}, {$pull: {grades: {$in: [req.params.grade]}}}, {safe: true, multi: true}, function(err, deleted){
        if(err) {
            req.flash("errror", "Something went wrong");
            res.redirect(`/teachers/${req.params.id}`);
        } else {
            res.redirect(`/teachers/${req.params.id}/edit`);
        }
    });
});

// ADD ONE SUBJECT IN DATABASE
router.post("/:id/edit/subject", teacher.subjectExist, function(req, res){
    Teachers.findById(req.params.id, function(err, teacher){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect("/teachers");
        } else {
            teacher.subjects.push(req.body.subject);
            teacher.save();
            res.redirect(`/teachers/${req.params.id}/edit`);
        }
    });
});

// DELETE ONE SUBJECT IN DATABASE
router.delete("/:id/edit/subject/:subject", function(req, res){
    Teachers.updateOne({_id: req.params.id}, {$pull: {subjects: {$in: [req.params.subject]}}}, {safe: true, multi: true}, function(err, deleted){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect(`/teachers/${req.params.id}`);
        } else {
            res.redirect(`/teachers/${req.params.id}/edit`);
        }
    });
});

// TEACHERS UDPATE ROUTE
router.put("/:id", teacher.gradeEmpty, teacher.subjectEmpty, function(req, res){
    Teachers.findByIdAndUpdate(req.params.id,
        {name: req.body.name, hours: req.body.hours, minutes: req.body.hours * 60},
        function(err, result){
            if(err) {
                req.flash("error", "Something went wrong");
                res.redirect("/teachers");
            } else {
                req.flash("success", "Updated!");
                res.redirect(`/teachers/${req.params.id}`);
            }
    });
});

// TEACHERS DESTROY ROUTE
router.delete("/:id", function(req, res){
    Teachers.findByIdAndRemove(req.params.id, function(err, deleted){
        if(err) {
            console.log(err);
        } else {
            req.flash("success", "Deleted!");
            res.redirect("/teachers");
        }
    });
});

// =============================
// MIDDLEWARE
// =============================

// CHECK IF GRADE LIST IS EMPTY
function isGradeEmpty(req, res, next){
    if(grades.length > 0) {
        next();
    } else {
        req.flash("error", "Add a grade");
        res.redirect("/teachers/new");
    }
}

// CHECK IF SUBJECT LIST IS EMPTY
function isSubjectEmpty(req, res, next){
    if(subjects.length > 0) {
        next();
    } else {
        req.flash("error", "Add a subject");
        res.redirect("/teachers/new");
    }
}

// CHECK IF GRADE IS ALREADY IN THE LIST
function gradeExist(req, res, next){
    if(!grades.includes(req.body.grade)) {
        next();
    } else {
        req.flash("error", "Grade is already in the list");
        res.redirect("/teachers/new");
    }
}

// CHECK IF SUBJECT IS ALREADY IN THE LIST
function subjectExist(req, res, next){
    if(!subjects.includes(req.body.subject)) {
        next();
    } else {
        req.flash("error", "Subject is already in the list");
        res.redirect("/teachers/new");
    }
}

module.exports = router;