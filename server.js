const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const app = express();

const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use("/EventPhotos", express.static("EventPhotos"));
app.use("/images", express.static("images"));

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
    db.retrieveEventByEventCode(eCode, function (event) {
        if(!event.hasOwnProperty("code")) {
            return res.status(404).end("Event with code " + eCode + "does not exist!");
        }
        return res.status(200).send(event);
    });
});

app.post("/api/events", function (req, res) {
    console.log(req.body);
    db.insertEvent(req.body.event, function(err) {
       if (err) {
           console.log(err);
           return res.status(500).end("Something went wrong!");
       }
       return res.status(201).send("Successfully created event!");
    });
});

app.post("/api/events/:eventcode/images", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.status(500).end("Something went wrong!");
        }
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
        db.insertImage(eventCode, tempImages[0], function(imageId) {
            res.location("/api/events/"+eventCode+"/images/"+imageId);
            return res.status(201).send("Successfully inserted image!");
        });

    });
});

app.get("/api/events/:eventcode/images", function (req, res) {
    var imagePaths = [];
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.status(500).end("Something went wrong");
        }

        var eCode = req.params.eventcode;
        db.doesEventCodeExist(eCode, function (eventCodeExists) {
            if(!eventCodeExists) {
                return res.status(404).send(imagePaths);
            }
            db.retrieveImagesByEventCode(eCode, function (data) {
                prepareResponse(data);
                return res.send(imagePaths);
            });
        });

        function prepareResponse(data) {
            for (var i in data) {
                imagePaths.push(data[i]);
            }

            if (imagePaths.length <= 0) {
                res.status(204);

            }
        }

    });
});

app.get("/api/events/:eventcode/images/:imageid", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.status(500).end("Something went wrong");
        }

        var eCode = req.params.eventcode;
        var imageId = req.params.imageid;
        db.doesEventCodeExist(eCode, function (eventCodeExists) {
            if(!eventCodeExists) {
                return res.status(404).end("Event with code " + eCode + " does not exist!");
            }
            db.retrieveImageById(eCode, imageId, function (image) {
                if (!image.hasOwnProperty("path")) {
                    return res.status(404).end("Image with id " + imageId + " does not exist!");
                }
                return res.send(image);
            });
        });
    });
});

app.delete("/api/events/:eventcode", function (req, res) {
    var eCode = req.params.eventcode;
    // if(checkAdmin(password)) {
        db.deleteEventByEventCode(eCode, function(err) {
            if(err) {
                return res.status(500).end("");
            }
            return res.status(204).end("");
        });
    // }
});

app.listen(port, function () {
    console.log("Server running on port: " + port + "..");
});

module.exports = app;