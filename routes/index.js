var express = require("express"),
    router  = express.Router();

// HOMEPAGE
router.get("/", function(req, res){
    res.render("home");
});

module.exports = router;