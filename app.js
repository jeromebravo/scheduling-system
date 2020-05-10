var express        = require("express"),
    mongoose       = require("mongoose"),
    bodyParser     = require("body-parser"),
    flash          = require("connect-flash"),
    session        = require("express-session"),
    methodOverride = require("method-override"),
    app            = express();

var indexRoutes      = require("./routes/index"),
    schoolYearRoutes = require("./routes/schoolYear"),
    gradeRoutes   = require("./routes/grade"),
    teacherRoutes    = require("./routes/teachers"),
    buildingRoutes   = require("./routes/buildings"),
    roomRoutes       = require("./routes/rooms"),
    scheduleRoutes   = require("./routes/schedule");

mongoose.connect("mongodb://localhost/scheduling_system", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useFindAndModify", false);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash());

app.use(session(
    {
        cookie: {maxAge: 60000},
        secret: "woot",
        resave: false,
        saveUninitialized: false
    }
));

app.use(function(req, res, next){
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use("/schoolYear", schoolYearRoutes);
app.use("/grade", gradeRoutes);
app.use("/teachers", teacherRoutes);
app.use("/buildings", buildingRoutes);
app.use("/buildings", roomRoutes);
app.use("/schedule", scheduleRoutes);

app.get("*", function(req, res){
    res.send("ERROR: PAGE NOT FOUND");
});

app.listen(3000, function(){
    console.log("Server has started!!!");
});