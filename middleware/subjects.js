var Subjects = require("../models/subjects");

var subject = {};

// CHECK IF SUBJECTS IN DATABASE IS EMPTY
subject.noSubject = function(req, res, next){
    Subjects.findById(req.params.id, function(err, subject){
        if(err) {
            console.log(err);
        } else {
            if(subject.subjects.length > 0) {
                next();
            } else {
                req.flash("error", "Add a subject");
                res.redirect(`/grade/${req.params.id}/edit`);
            }
        }
    });
}

// CHECK IF SUBJECT ALREADY IN DATABASE
subject.existInDB = function(req, res, next){
    Subjects.find({_id: req.params.id, subjects: {$elemMatch: {name: req.body.subject.name}}}, function(err, foundSubject){
        if(err) {
            console.log(err);
        } else {
            if(foundSubject.length === 0) {
                next();
            } else {
                req.flash("error", "Subject is already in the list");
                res.redirect(`/grade/${req.params.id}/edit`);
            }
        }
    });
}

// CHECK IF GRADE IS ALREADY IN DATABASE
// POST REQUEST
subject.newGradeExist = function(req, res, next){
    Subjects.find({grade: req.body.grade}, function(err, foundGrade){
        if(err) {
            console.log(err);
        } else {
            if(foundGrade.length === 0) {
                next();
            } else {
                req.flash("error", `Grade ${req.body.grade} is already exist`);
                res.redirect("/grade");
            }
        }
    });
}

// CHECK IF GRADE IS ALREADY EXIST IN DATABASE 
// PUT REQUEST
subject.gradeExist = function(req, res, next){
    Subjects.find({grade: req.body.grade, _id: {$ne: req.params.id}}, function(err, foundGrade){
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect("/subjects");
        } else {
            if(foundGrade.length === 0) {
                next();
            } else {
                req.flash("error", `Grade ${req.body.grade} is already exist`);
                res.redirect("/grade");
            }
        }
    });
}

module.exports = subject;