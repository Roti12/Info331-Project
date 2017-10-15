const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const app = express();

const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const db = require('./routes/db.js');


const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./images");
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
})


const upload = multer({
    storage: storage
}).array("file", 3);


app.get("/", function(req, res) {
    res.sendFile(__dirname + "/EventPhotos/index.html");
     //db.retrieveEvent();
})

app.post("/api/Upload", function(req, res) {
    upload(req, res, function(err) {
        if (err) {
            return res.end("Something went wrong!");
        } 
        
    var tempImages = [];
    req.files.forEach(function(element){
    tempImages.push(element.originalname, element.path, element.size);
})

    JSON.stringify(tempImages);
        
    db.insertImage(tempImages);    
    return res.end("Image uploaded successfully!");
    
})
})

app.post("/api/Gallery", function(req, res) {
    upload(req, res, function(err) {
        if(err) {
            return res.end("Something went wrong");
        }
        
        var eCode = req.body.eventCodeText;
        console.log(eCode);
    })
    
    return res.end("Event code exists");
})

app.listen(port, function() {
   console.log("Server running on port: " + port + ".."); 
});