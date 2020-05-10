var Teachers = require("../models/teachers");

var teacher = {};

// CHECK IF GRADE IS EMPTY
teacher.gradeEmpty = function(req, res, next){
    Teachers.findById(req.params.id, function(err, foundTeacher){
        if(err) {
            console.log(err);
        } else {
            if(foundTeacher.grades.length > 0) {
                next();
            } else {
                req.flash("error", "Add a grade");
                res.redirect(`/teachers/${req.params.id}/edit`);
            }
        }
    });
}

// CHECK IF SUBJECT IS EMPTY
teacher.subjectEmpty = function(req, res, next){
    Teachers.findById(req.params.id, function(err, foundTeacher){
        if(err) {
            console.log(err);
        } else {
            if(foundTeacher.subjects.length > 0) {
                next();
            } else {
                req.flash("error", "Add a subject");
                res.redirect(`/teachers/${req.params.id}/edit`);
            }
        }
    });
}

// CHECK IF GRADE IS ALREADY IN THE DATABASE
teacher.gradeExist = function(req, res, next){
    Teachers.findById(req.params.id, function(err, foundTeacher){
        if(err) {
            console.log(err);
        } else {
            if(!foundTeacher.grades.includes(req.body.grade)) {
                next();
            } else {
                req.flash("error", "Grade is already in the list");
                res.redirect(`/teachers/${req.params.id}/edit`);
            }
        }
    });
}

// CHECK IF SUBJECT IS ALREADY IN THE DATABASE
teacher.subjectExist = function(req, res, next){
    Teachers.findById(req.params.id, function(err, foundTeacher){
        if(err) {
            console.log(err);
        } else {
            if(!foundTeacher.subjects.includes(req.body.subject)) {
                next();
            } else {
                req.flash("error", "Subject is already in the list");
                res.redirect(`/teachers/${req.params.id}/edit`);
            }
        }
    });
}

module.exports = teacher;