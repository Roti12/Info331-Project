const express = require("express");

const app = express();
const port = 3000;

const db = require('./routes/db.js');

app.get("/", function(req, res) {
    res.send("Welcome to homepage");
     db.retrieveEvent();
})

app.listen(port, function() {
   console.log("Server running on port: " + port + ".."); 
});