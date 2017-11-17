const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const jwtDecode = require('jwt-decode');
const app = express();

const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use("/EventPhotos", express.static("EventPhotos"));
app.use("/images", express.static("images"));


app.use(expressJwt({secret: 'test123'}).unless({path: [/^\/api\/events\/.*\/login/, '/api/events'], custom: function(req) {return process.env.NODE_ENV === 'test'}}));

const db = require('./routes/db.js');
const auth = require('./routes/authentication.js');


const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./images");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
        // new Date().toLocaleString() does not work
    }
});


const upload = multer({
    storage: storage
}).array("file", 3);

function processAuthentication (req, res, next) {
    if(process.env.NODE_ENV === 'test') {
        return next();
    }
    var decodedToken = jwtDecode(req.get('Authorization').substr(7));
    var regex = /.*\/events\/(\d+).*/gi;
    var eCode;
    if (req.url.match(regex)) {
        eCode = regex.exec(req.url)[1];
    }
    if (typeof eCode != 'undefined' && decodedToken.eventcode !== eCode) {
        return res.status(401).end("Unauthorized for this event!");
    }
    if (req.method === 'DELETE' && !decodedToken.admin) {
        return res.status(403).end("Admin privileges required!");
    }

    // keep executing the router middleware
    next()
}

app.use(processAuthentication);

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/EventPhotos/index.html");
    /*auth.checkForPassword(12345, function(bool) {
        if(bool) { // CHECKS IF THERE IS A PASSWORD
            console.log("PASSWORD REQUIRED");
            auth.checkIfCorrectlyEntered(12345, "hello", function(boolOne) {
                if(boolOne) console.log("Success"); // TRUE IF PASSWORD SUCCESSFULLY ENTERED - EITHER NORMAL PW OR ADMIN PW
                else console.log("Wrong password"); // FALSE IF INCORRECTLY ENTERED
            });
        } else console.log("SUCCESS - NO PASSWORD REQUIRED"); // NO PASSWORD
    });*/
    //db.retrieveEvent();
});

app.get("/api/events/:eventcode", function (req, res) {

    var eCode = req.params.eventcode;
    db.retrieveEventByEventCode(eCode, function (err, event) {
        if(err) return next(err);
        if(!event.hasOwnProperty("code")) {
            return res.status(404).end("Event with code " + eCode + " does not exist!");
        }
        return res.status(200).send(event);
    });
});

app.get("/api/events/:eventcode/images", function (req, res, next) {
    var imagePaths = [];
    upload(req, res, function (err) {
        if(err) return next(err);

        var eCode = req.params.eventcode;
        db.doesEventCodeExist(eCode, function (err, eventCodeExists) {
            if(err) return next(err);
            if(!eventCodeExists) {
                return res.status(404).send(imagePaths);
            }
            db.retrieveImagesByEventCode(eCode, function (err, data) {
                if(err) return next(err);
                prepareResponse(data);
                return res.send(imagePaths);
            });
        });

        function prepareResponse(data) {
            for(var i in data) {
                imagePaths.push(data[i]);
            }

            if (imagePaths.length <= 0) {
                res.status(204);
            }
        }

    });
});

app.get("/api/events/:eventcode/images/:imageid", function (req, res, next) {
    upload(req, res, function (err) {
        if(err) return next(err);

        var eCode = req.params.eventcode;
        var imageId = req.params.imageid;
        db.doesEventCodeExist(eCode, function (err, eventCodeExists) {
            if(err) return next(err);
            if(!eventCodeExists) {
                return res.status(404).end("Event with code " + eCode + " does not exist!");
            }
            db.retrieveImageById(eCode, imageId, function (err, image) {
                if(err) return next(err);
                if(!image.hasOwnProperty("path")) {
                    return res.status(404).end("Image with id " + imageId + " does not exist!");
                }
                return res.status(200).send(image);
            });
        });
    });
});

app.post("/api/events", function (req, res) {
    console.log(req.body);
    db.insertEvent(req.body.event, function(err, eventCode) {
        if(err) return next(err);
        res.location("/api/events/"+eventCode);
        return res.status(201).send("Successfully created event!");
    });
});

app.post("/api/events/:eventcode/images", function (req, res,next) {
    upload(req, res, function (err) {
        if(err) return next(err);
        var eventCode = req.params.eventcode;

        var tempImages = [];
        req.files.forEach(function (element) {
            var image = {
                name: element.originalname,
                path: element.path,
                size: element.size
            };
            tempImages.push(image);
        });

        // At the moment just one image is inserted into the database
        // If performance issues occur, multiple images at a time may be processed
        db.insertImage(eventCode, tempImages[0], function(err, imageId) {
            if(err) return next(err);
            res.location("/api/events/"+eventCode+"/images/"+imageId);
            return res.status(201).send("Successfully inserted image!");
        });

    });
});

app.post("/api/events/:eventcode/login", function (req, res) {
    var eCode = req.params.eventcode;
    db.retrieveEventByEventCode(eCode, function (err, event) {
        if(err) return next(err);
        if(!event.hasOwnProperty("code")) {
            return res.status(404).end("Event with code " + eCode + " does not exist!");
        }
        if(auth.authenticate(req.body.password, event.optPassword, null)) {
            var token = jwt.sign({"admin": false, "eventcode": eCode}, 'test123');
            return res.status(200).send(token);
        } else if (auth.authenticate(req.body.password, null, event.adminPassword)) {
            var token = jwt.sign({"admin": true, "eventcode": eCode}, 'test123');
            return res.status(200).send(token);
        }
        else {
            return res.status(401).end("Invalid password");
        }
    });
});

app.put("/api/events/:eventcode", function (req, res) {
    var eCode = req.params.eventcode;
    db.doesEventCodeExist(eCode, function (err, eventCodeExists) {
        if(err) return next(err);
        if (!eventCodeExists) {
            return res.status(404).end("Event with code " + eCode + " does not exist!");
        }
        db.updateEvent(eCode, req.body.event, function (err, result) {
            if(err) return next(err);
            return res.status(201).send("Successfully updated event with code " + eCode + "!");
        });
    });
});

app.delete("/api/events/:eventcode/", function (req, res) {
    var eCode = req.params.eventcode;
    db.deleteEventByEventCode(eCode, function(err) {
        if(err) return next(err);
        return res.status(204).end("");
    });
});

app.delete("/api/events/:eventcode/images/:imageid", function (req, res, next) {
    var imageId = req.params.imageid;
    db.deleteImageById(imageId, function(err, result) {
        if(err) return next(err);
        return res.status(204).end("");
    });
});

app.listen(port, function () {
    console.log("Server running on port: " + port + "..");
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

module.exports = app;