const express = require("express");
const async = require("async");
const multer = require("multer");
const bodyParser = require("body-parser");
const moment = require("moment");
const express = require("express"); // framework
const multer = require("multer"); // middleware for uploading
const bodyParser = require("body-parser"); // middleware for parsing
const moment = require("moment");
const cors = require("cors");
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken'); 
const jwtDecode = require('jwt-decode');
const Vision = require('@google-cloud/vision');
const admin = require("firebase-admin");
const serviceAccount = require("./evntFirebase-adminSDK.json");

const vision = new Vision();

const app = express();

const port = 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use("/EventPhotos", express.static("EventPhotos"));
app.use("/images", express.static("images"));


app.use(expressJwt({secret: 'test123'}).unless({path: [/^\/api\/events\/.*\/login/, '/api/events', '/index'], custom: function(req) {return process.env.NODE_ENV === 'test'}}));

const db = require('./routes/db.js');
const auth = require('./routes/authentication.js');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "eventpictures"
});

var bucket = admin.storage().bucket();

/*
* Middleware for storing images/uploaded files in designated folder.
*/
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./images");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
        // new Date().toLocaleString() does not work
    }
});

/*
* Middleware used for uploading files, images in  this case.
* Max for upload is an array of size 3.
*/
const upload = multer({
    storage: storage
}).array("file", 3);


/**
 * viewingDelay - minutes after the end of the event until the images are visible
 **/
function determineEventStatus(startTime, endTime, viewingDelay) {
    var currentTime = Date.now();
    var status;
    if (currentTime < startTime) status = "upcoming";
    else if (currentTime >= startTime && currentTime <= endTime) status = "active";
    else if (currentTime > endTime && currentTime < endTime + (viewingDelay*60000)) status = "over";
    else status = "viewable";
    return status;
}

function setCorsConfig(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, content-type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", true);
}

function preErrorCheck(req, res, next) {
    var regex = /.*\/events\/(\d+).*/gi;
    if(req.url.match(regex)) {
        var eCode = regex.exec(req.url)[1];
        db.doesEventCodeExist(eCode, function(err, codeExists) {
           if(err) return next(err);
           if(!codeExists) return res.status(404).end("Event with code " + eCode + " does not exist!");
           return next();
        });
    } else {
        next();
    }
}

function processAuthentication (req, res, next) {
    if(process.env.NODE_ENV === 'test' || typeof req.get('Authorization') == 'undefined') {
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
    if (req.method === 'GET' && req.url.match(/.*images.*/) && typeof eCode != 'undefined') {
        db.retrieveImagesByEventCode(eCode, function(err, event) {
            if(err) return next(err);
            var eventStatus = determineEventStatus(event.startTime, event.endTime, 120);
            if(eventStatus !== 'viewable' || (decodedToken.admin && eventStatus !== 'viewable' && eventStatus !== 'over')) {
                return status(403).end("It is not yet possible to view the pictures!");
            }
        });
    }

    // keep executing the router middleware
    next()
}

app.use(setCorsConfig);
app.use(preErrorCheck);
app.use(processAuthentication);

app.get("/index", function (req, res) {
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

/*
* Get request for retrieving all events by their event codes.
*/
app.get("/api/events/:eventcode", function (req, res, next) {

    var eCode = req.params.eventcode;
    db.retrieveEventByEventCode(eCode, function (err, event) {
        if(err) return next(err);
        return res.status(200).send(event);
    });
});

/*
* Get request for retrieving images.
*/
app.get("/api/events/:eventcode/images", function (req, res, next) {
    var eCode = req.params.eventcode;
    db.retrieveImagesByEventCode(eCode, function (err, images) {
        if(err) return next(err);
        var modifiedImages = images;
        console.log(images);
        if (images.length <= 0) return res.status(204).send("No images found for event with code " + eCode);
        var config = {
            action: 'read',
            expires: '03-17-2025'
        };
        var labelImage = function(image, index, callback) {
            const gcsPath = 'gs://eventpictures/' + image.path;
            console.log(gcsPath);
            // Performs safe search property detection on the remote file
            vision.safeSearchDetection({ source: { imageUri: gcsPath } }, function (err, result) {
                if(err) return callback(err);
                console.log(result);
                const detections = result.safeSearchAnnotation;

                console.log(`Adult: ${detections.adult}`);
                console.log(`Spoof: ${detections.spoof}`);
                console.log(`Medical: ${detections.medical}`);
                console.log(`Violence: ${detections.violence}`);
                modifiedImages[index].safeSearch = detections;
                callback();
            });
        }
        var getUrl = function(image, index, callback) {
            bucket.file(image.path).getSignedUrl(config, function(err, url) {
                if (err) return callback(err);
                modifiedImages[index].path = url;
                callback();

            });
        }
        async.eachOf(
            images,
            async.applyEach([getUrl, labelImage]),
            function(err) {
                if(err) return next(err);
                return res.status(200).send(modifiedImages);
            }
        );
    });
});

app.get("/api/events/:eventcode/images/:imageid", function (req, res, next) {

    var eCode = req.params.eventcode;
    var imageId = req.params.imageid;
    db.retrieveImageById(eCode, imageId, function (err, image) {
        if(err) return next(err);
        if(!image.hasOwnProperty("path")) {
            return res.status(404).end("Image with id " + imageId + " does not exist!");
        }
        var config = {
            action: 'read',
            expires: '03-17-2025'
        };

        bucket.file(image.path).getSignedUrl(config, function(err, url) {
            if (err) return next(err);
            image.path = url;
            return res.status(200).send(image);
        });
    });
});

/*
* Post request for inserting event created on front end.
*/
app.post("/api/events", function (req, res) {
    console.log(req.body);
    db.insertEvent(req.body.event, function(err, eventCode) {
        if(err) return next(err);
        res.location("/api/events/"+eventCode);
        var result = {
            text: "Successfully created event!",
            eventCode: eventCode
        };
        return res.status(201).send(result);
    });
});

/*
* Post request for inserting uploaded image info into DB
* and image itself
*/
app.post("/api/events/:eventcode/images", function (req, res,next) {

    var eventCode = req.params.eventcode;
    var filename = eventCode + "/" + moment().format("YYYY-MM-DD_HHmmss") + "_" + req.body.fileMetadata.name;
    console.log(filename);
    var file = bucket.file(filename);
    file.getSignedUrl({
        contentType: req.body.fileMetadata.type,
        action: 'write',
        expires: '03-17-2025'
    }, function(err, url) {
        if (err) return next(err);
        var tempImages = [];
        var image = {
            name: req.body.fileMetadata.name,
            path: filename,
            size: req.body.fileMetadata.size
        };
        tempImages.push(image);

        // At the moment just one image is inserted into the database
        // If performance issues occur, multiple images at a time may be processed
        db.insertImage(eventCode, tempImages[0], function(err, imageId) {
            if(err) return next(err);
            res.location("/api/events/"+eventCode+"/images/"+imageId);
            return res.status(201).send(url);
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

/*
* Updates an event. 
*/
app.put("/api/events/:eventcode", function (req, res) {
    var eCode = req.params.eventcode;
    db.updateEvent(eCode, req.body.event, function (err, result) {
        if(err) return next(err);
        return res.status(201).send("Successfully updated event with code " + eCode + "!");
    });
});

/*
* Deletes an event
*/
app.delete("/api/events/:eventcode/", function (req, res) {
    var eCode = req.params.eventcode;
    db.deleteEventByEventCode(eCode, function(err) {
        if(err) return next(err);
        console.log("event deleted from database");
        bucket.getFiles({prefix: eCode}, function(err, files) {
            console.log("found files:");
            console.log(files);
            if(files.length <= 0)
                return res.status(204).send("Successfully deleted event with code " + eCode + "!");
            var fileCounter = 0;
           for (var i = 0; i < files.length; i++) {
              files[i].delete(function (err, apiResponse) {
                  if(err) return next(err);
                  console.log("file deleted from storage");
                  fileCounter++;
                  if(fileCounter >= files.length)
                      return res.status(204).send("Successfully deleted event with code " + eCode + "!");
              });
           }
        });
    });
});

/*
* Deletes an image by its ID.
*/
app.delete("/api/events/:eventcode/images/:imageid", function (req, res, next) {
    var imageId = req.params.imageid;
    var eCode = req.params.eventcode;
    db.retrieveImageById(eCode, imageId, function (err, image) {
        if(err) return next(err);
        if(Object.keys(image).length === 0 && image.constructor === Object) return res.status(404).send("Image with id " + imageId + " does not exist!");
        db.deleteImageById(imageId, function(err, result) {
            if(err) return next(err);
            bucket.getFiles({prefix: image.path}, function(err, files) {
                if(files.length <= 0) return res.status(204).send("Successfully deleted image with id " + imageId + "!");
                if(files.length > 1) return next(new Error("Could not find image with id " + imageId + "."));
                files[0].delete(function (err, apiResponse) {
                    if(err) return next(err);
                    return res.status(204).send("Successfully deleted image with id " + imageId + "!");
                });
            });
        });
    });
});

/*
* Where the server is running. Listening to port 3000
*/
app.listen(port, function () {
    console.log("Server running on port: " + port + "..");
});

/*
* Error handling.
*/
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

module.exports = app;