var express     = require("express"),
    router      = express.Router(),
    csv         = require("fast-csv"),
    Section     = require("../models/section"),
    Subjects    = require("../models/subjects"),
    Teachers    = require("../models/teachers"),
    Rooms       = require("../models/rooms"),
    SchoolYear  = require("../models/schoolYear"),
    Canteen     = require("../models/canteen");

var schoolYear;

// SEARCH GRADE
router.get("/searchGrade", function(req ,res){
    res.render("schedule/section/search");
});

// SHOW ALL SECTIONS OF SEARCHED GRADE
router.post("/searchGrade/sections", async function(req, res){
    var sections = await Section.find({grade: req.body.grade, schoolYear: req.body.sy});

    if(sections.length === 0) {
        req.flash("error", "No grade found");
        return res.redirect("/schedule/searchGrade");
    }

    res.render("schedule/section/index", {sections: sections, grade: req.body.grade});
});

// SHOW SECTION SCHEDULE
router.get("/searchGrade/sections/:id", async function(req, res){
    var section = await Section.findById(req.params.id);
    res.render("schedule/section/show", {section: section});
});

// SEARCH TEACHER
router.get("/searchTeacher", function(req, res){
    res.render("schedule/teacher/search");
});

// TEACHERS INDEX PAGE
router.post("/searchTeacher/teacher", async function(req, res){
    var teachers = await Teachers.find({name: req.body.name});
    schoolYear = req.body.sy;
    
    if(teachers.length === 0) {
        req.flash("error", "No teacher found");
        return res.redirect("/schedule/searchTeacher");
    }

    res.render("schedule/teacher/index", {teachers: teachers});
});

// SHOW TEACHER SCHEDULE
router.get("/searchTeacher/teacher/:id", async function(req, res){
    var teacher = await Teachers.findById(req.params.id);
    
    var i = 0;
    var schedule;
    while(i < teacher.schedule.length) {
        if(teacher.schedule[i].schoolYear === schoolYear) {
            schedule = teacher.schedule[i].schedule;
            break;
        }

        i++;
    }

    res.render("schedule/teacher/show", {teacher: teacher, schoolYear: schoolYear, schedule: schedule});
});

// SEARCH BUILDING
router.get("/searchBuilding", function(req ,res){
    res.render("schedule/room/search");
});

// BUILDING INDEX PAGE
// SHOW ALL ROOMS IN THIS BUILDING
router.post("/searchBuilding/rooms", async function(req, res){
    var rooms = await Rooms.find({building: req.body.building});
    schoolYear = req.body.sy;

    if(rooms.length === 0) {
        req.flash("error", "No building found");
        return res.redirect("/schedule/searchBuilding");
    }

    res.render("schedule/room/index", {rooms: rooms, building: req.body.building});
});

// SHOW ROOM SCHEDULE
router.get("/searchBuilding/rooms/:id", async function(req, res){
    var room = await Rooms.findById(req.params.id);
    
    var i = 0;
    var schedule;
    while(i < room.schedule.length) {
        if(room.schedule[i].schoolYear === schoolYear) {
            schedule = room.schedule[i].schedule;
            break;
        }

        i++;
    }

    res.render("schedule/room/show", {room: room, schoolYear: schoolYear, schedule: schedule});
});

// SCHEDULE NEW ROUTE
// SHOWS FORM
router.get("/new", function(req, res){
    res.render("schedule/new");
});

// SCHEDULE CREATE ROUTE
router.post("/", function(req, res){
    generate(req, res);
});

// GENERATE SCHEDULE
async function generate(req, res){
    // FIND LATEST SCHOOL YEAR
    var schoolYear = await SchoolYear.findOne({}).sort("-created");
    
    if(schoolYear === null) {
        req.flash("error", "Add a school year");
        res.redirect("/schoolyear/new");
    }

    // STORE UNIQUE GRADES FROM CSV FILE
    var grades = [];

    // STORE THE LAST INSERTED SECTION FROM CSV FILE
    var lastSection;

    // STORE SUBJECTS
    var subjects = {};

    var gradeAndSection = [];

    var success = 0;
    var noSubjects = [];

    // READ CSV FILE
    csv.parseFile(req.body.file)
    .on ("data", function(data) {
        gradeAndSection.push(data);
    })
    .on("end", async function() {
        var i = 0;
        while(i < gradeAndSection.length) {
            var grade = gradeAndSection[i][0];
            var section = gradeAndSection[i][1];

            // CHECK IF GRADE IS NOT INCLUDED IN grades
            if(!grades.includes(grade)) {
                // PUSH grade IN grades
                grades.push(grade);

                // SET section AS LAST SECTION
                lastSection = section;

                // FIND SUBJECTS FOR THIS GRADE
                var getSubjects = await Subjects.findOne({grade: grade});

                // NO SUBJECTS
                if(getSubjects === null) {
                    noSubjects.push(grade);
                    i++;
                    continue;
                }
                
                // CREATE NEW OBJECT INSIDE OF subjects
                subjects[grade] = {};

                // ADD SUBJECTS FOR THIS GRADE AND SECTION
                subjects[grade][section] = getSubjects.subjects;
            } else {
                try {
                    // FIND TEACHERS WHO CAN TEACH THIS GRADE
                    var teachers = await Teachers.find({grades: grade});

                    // ADD SUBJECTS FOR THIS GRADE AND SECTION
                    // ADJUST THE ORDER OF SUBJECTS
                    subjects[grade][section] = adjust(subjects[grade][lastSection], teachers);

                    // SET section[1] AS LAST SECTION
                    lastSection = section;
                } catch {
                    i++;
                    continue;
                }
            }

            // ADJUST THE START OF CLASS
            var full = await Canteen.find({numberOfSections: 6});
            var startTimeIn = "07:00";
            var startTimeOut = addTime(startTimeIn, 15 * Math.floor(full.length / 2));

            // INSERT GRADE AND SECTION IN DATABASE
            var sectionCreated = await Section.create({
                grade: grade,
                section: section,
                schoolYear: schoolYear.schoolYear,
                schedule: [
                    {
                        timeIn: startTimeIn,
                        timeOut: startTimeOut
                    }
                ]
            });

            // FIND ROOMS
            var foundRooms = await Rooms.find({grades: grade});

            // SUBJECTS OF THIS GRADE AND SECTION
            var sectionSubject = subjects[grade][section];

            // GET THE INDEX OF FIRST BREAK TIME
            var first = Math.floor(sectionSubject.length / 2) - 1;

            // GET THE INDEX OF SECOND BREAK TIME
            var last = (first * 2) + 1;

            // LOOP THROUGH SUBJECTS
            var breakTimeIndex = 0;
            var j = 0;
            while(j < sectionSubject.length) {
                // GET THE LENGTH OF SECTION SCHEDULE
                var index = sectionCreated["schedule"].length;
                // GET THE LATEST TIME OUT FROM SECTION SCHEDULE
                var timeIn = sectionCreated["schedule"][index - 1].timeOut;
                // ADD subject.minutes IN var timeIn
                var timeOut = addTime(timeIn, sectionSubject[j].minutes);

                // NO ROOM YET
                if(j === 0) {
                    // LOOP THROUGH ROOMS
                    var y = 0;
                    var availableRoom = false;
                    while(y < foundRooms.length) {
                        var room = foundRooms[y];

                        // CHECK IF ROOM IS NOT AVAILABLE
                        var roomSchedule = await Rooms.findOne({
                            _id: room._id,
                            schedule: {$elemMatch: {
                                schoolYear: schoolYear.schoolYear,
                                schedule: {$elemMatch: {
                                    timeIn: {$lte: timeIn},
                                    timeOut: {$gt: timeIn},
                                    subject: {$ne: undefined}
                                }}
                            }}
                        });

                        // ROOM IS AVAILABLE
                        if(roomSchedule === null) {
                            availableRoom = true;
                            break;
                        }

                        y++;
                    }
                } else {
                    var room = sectionCreated["schedule"][1].room;
                    
                    if(room === "No available room") {
                        // LOOP THROUGH ROOMS
                        var y = 0;
                        var availableRoom = false;
                        while(y < foundRooms.length) {
                            var room = foundRooms[y];

                            // CHECK IF ROOM IS NOT AVAILABLE
                            var roomSchedule = await Rooms.findOne({
                                _id: room._id,
                                schedule: {$elemMatch: {
                                    schoolYear: schoolYear.schoolYear,
                                    schedule: {$elemMatch: {
                                        timeIn: {$lte: timeIn},
                                        timeOut: {$gt: timeIn},
                                        subject: {$ne: undefined}
                                    }}
                                }}
                            });

                            // ROOM IS AVAILABLE
                            if(roomSchedule === null) {
                                availableRoom = true;
                                break;
                            }

                            y++;
                        }
                    } else {
                        var availableRoom = true;
                        var room = room.split(" - ");
                        var room = await Rooms.findOne({building: room[0], roomNumber: room[1]});
                    }
                }

                // BREAK TIME
                var breaktime = true;
                if(breakTimeIndex === first || breakTimeIndex === last) {
                    var out = addTime(timeIn, 20);
                    var canteen = await Canteen.findOne({timeIn: timeIn, timeOut: out, schoolYear: schoolYear.schoolYear});
                    
                    // CREATE NEW CANTEEN SCHEDULE
                    if(canteen === null) {
                        var canteen = await Canteen.create({
                            timeIn: timeIn,
                            timeOut: out,
                            numberOfSections: 0,
                            schoolYear: schoolYear.schoolYear
                        });
                    }

                    // CHECK IF CANTEEN IS AVAILABLE
                    if(canteen.numberOfSections < 6) {
                        canteen.numberOfSections += 1;
                        canteen.save();

                        // PUSH NEW SECTION SCHEDULE
                        sectionCreated.schedule.push({
                            subject: "Break time",
                            timeIn: timeIn,
                            timeOut: out
                        });

                        console.log("break time");
                        breakTimeIndex++;
                        continue;
                    }

                    breaktime = false;
                }

                // FIND TEACHERS WHO CAN TEACH grade AND sectionSubject[j].name
                var foundTeachers = await Teachers.find({
                    grades: grade, subjects: sectionSubject[j].name, minutes: {$gte: sectionSubject[j].minutes * 5}
                });
                
                // LOOP THROUGH TEACHERS
                var x = 0;
                var availableTeacher = false;
                while(x < foundTeachers.length) {
                    var teacher = foundTeachers[x];
                    
                    // CHECK IF TEACHER IS NOT AVAILABLE
                    var teacherSchedule = await Teachers.findOne({
                        _id: teacher._id,
                        schedule: {$elemMatch: {
                            schoolYear: schoolYear.schoolYear,
                            schedule: {$elemMatch: {
                                timeIn: {$lte: timeIn},
                                timeOut: {$gt: timeIn},
                                subject: {$ne: undefined}
                            }}
                        }}
                    });
                    
                    // TEACHER IS AVAILABLE
                    if(teacherSchedule === null) {
                        availableTeacher = true;
                        break;
                    }

                    x++;
                }

                if(availableTeacher && availableRoom) {
                    // PUSH NEW SECTION SCHEDULE
                    newSectionSchedule(sectionCreated, {
                        subject: sectionSubject[j].name,
                        timeIn: timeIn,
                        timeOut: timeOut,
                        teacher: teacher.name,
                        room: `${room.building} - ${room.roomNumber}`
                    });
                    
                    // PUSH NEW TEACHER SCHEDULE
                    newTeacherSchedule(teacher, schoolYear.schoolYear, sectionSubject[j].minutes, {
                        section: `${sectionCreated.grade} - ${sectionCreated.section}`,
                        subject: sectionSubject[j].name,
                        timeIn: timeIn,
                        timeOut: timeOut,
                        room: `${room.building} - ${room.roomNumber}`,
                        schoolYear: schoolYear.schoolYear
                    });

                    // PUSH NEW ROOM SCHEDULE
                    newRoomSchedule(room, schoolYear.schoolYear, {
                        section: `${sectionCreated.grade} - ${sectionCreated.section}`,
                        subject: sectionSubject[j].name,
                        timeIn: timeIn,
                        timeOut: timeOut,
                        teacher: teacher.name,
                        schoolYear: schoolYear.schoolYear
                    });

                } else {
                    var sectionSchedule = {
                        subject: sectionSubject[j].name,
                        timeIn: timeIn,
                        timeOut: timeOut,
                    };

                    var teacherName, roomName;

                    // NO AVAILABLE TEACHER
                    if(!availableTeacher) {
                        teacherName = "No available teacher"
                        sectionSchedule.teacher = teacherName;
                    } else {
                        teacherName = teacher.name;
                        sectionSchedule.teacher = teacherName;
                    }

                    // NO AVAILABLE ROOM
                    if(!availableRoom) {
                        roomName = "No available room"
                        sectionSchedule.room = roomName;
                    } else {
                        roomName = `${room.building} - ${room.roomNumber}`;
                        sectionSchedule.room = roomName;
                    }

                    // THERE IS AN AVAILABLE TEACHER
                    if(availableTeacher) {
                        // PUSH NEW TEACHER SCHEDULE
                        newTeacherSchedule(teacher, schoolYear.schoolYear, sectionSubject[j].minutes, {
                            section: `${sectionCreated.grade} - ${sectionCreated.section}`,
                            subject: sectionSubject[j].name,
                            timeIn: timeIn,
                            timeOut: timeOut,
                            room: roomName,
                            schoolYear: schoolYear.schoolYear
                        });
                    }

                    // THERE IS AN AVAILABLE ROOM
                    if(availableRoom) {
                        // PUSH NEW ROOM SCHEDULE
                        newRoomSchedule(room, schoolYear.schoolYear, {
                            section: `${sectionCreated.grade} - ${sectionCreated.section}`,
                            subject: sectionSubject[j].name,
                            timeIn: timeIn,
                            timeOut: timeOut,
                            teacher: teacherName,
                            schoolYear: schoolYear.schoolYear
                        });
                    }

                    // PUSH NEW SECTION SCHEDULE
                    newSectionSchedule(sectionCreated, sectionSchedule);

                    console.log("ELSE");
                }

                j++;

                if(breaktime) {
                    breakTimeIndex++;
                }
            }

            success++;
            i++;
        }
        
        console.log("end");

        if(noSubjects.length > 0) {
            req.flash("error", `Grade ${noSubjects} does not have subjects`);
        }

        if(success > 0) {
            req.flash("success", `Success: ${success}`);
        }

        res.redirect("/grade");
    });

    
}

function addTime(time, duration){
    var t = time.split(":");
    var hour = t[0], minute = (parseInt(t[1]) + duration);

    if(minute > 60) {
        minute = minute - 60;
        hour = parseInt(hour) + 1;
    } else if(minute === 60) {
        minute = "00";
        hour = parseInt(hour) + 1;
    }

    if(minute.toString().length === 1) {
        minute = `0${minute}`;
    }

    if(hour.toString().length === 1) {
        hour = `0${hour}`;
    }

    return `${hour}:${minute}`;
}

// ADJUST THE ORDER OF SUBJECTS
function adjust(arr, teachers){
    var index = Math.round(arr.length / teachers.length);
	
    var holder = [];
    for(; index < arr.length; index++){
        holder.push(arr[index]);
    }
    
    index = Math.round(arr.length / teachers.length);

    for(var i = 0; i < index; i++){
        holder.push(arr[i]);
    }
    
    return holder;
}

function compare(a, b){
    if(a.timeIn < b.timeIn) {
        return - 1;
    }

    if(a.timeIn > b.timeIn) {
        return 1;
    }

    return 0;
}

// PUSH NEW SECTION SCHEDULE
function newSectionSchedule(section, schedule) {
    section.schedule.push(schedule);
    section.save();
}

// PUSH NEW TEACHER SCHEDULE
function newTeacherSchedule(teacher, schoolYear, minutes, schedule) {
    var i = 0;
    while(i < teacher.schedule.length) {
        if(teacher.schedule[i].schoolYear === schoolYear) {
            teacher.schedule[i].schedule.push(schedule);
            break;
        }

        i++;
    }
    // UPDATE REMAINING MINUTES
    teacher.minutes -= minutes * 5
    teacher.save();
}

// PUSH NEW ROOM SCHEDULE
function newRoomSchedule(room, schoolYear, schedule) {
    var i = 0;
    while(i < room.schedule.length) {
        if(room.schedule[i].schoolYear === schoolYear) {
            room.schedule[i].schedule.push(schedule);
            break;
        }

        i++;
    }
    room.save();
}

async function test(req, res) {
    // var room = await Rooms.findOne({roomNumber: "101"});
    // room.schedule.push({
    //     subject: "Science",
    //     timeIn: "07:00",
    //     timeOut: "08:00"
    // });
    // room.save();

    var room = await Rooms.findOne({
        roomNumber: "101",
        schedule: {$elemMatch: {timeIn: {$lte: "09:30"}, timeOut: {$gt: "09:30"}, subject: {$ne: undefined}}}
    });
    console.log(`room = ${room}`);
}

module.exports = router;