const mysql = require("mysql");
var fs = require('fs');
// const Image = require("../controllers/models/image");

/*
* Database access information
*/
const testDb = {
    host: "localhost",
    user: "root",
    password: "root",
    database: "info331test",
    port: 3306
};

//CREATE A POOL INSTEAD?
//Database connection
const prodDb = {
    host: "sql11.freemysqlhosting.net",
    user: "sql11198291",
    password: "rWNaHXbxq6",
    database: "sql11198291",
    port: 3306,

    //dev-range-182012:europe-west1:eventphotodb
    //root
    //thisisnotkahoot
};

/*
* Sets the connection to the live database.
*/
var connection = mysql.createConnection(prodDb);
if (process.env.NODE_ENV === 'test') { 
    connection = mysql.createConnection(prodDb);
} else {
    connection = mysql.createConnection(prodDb);
}

/*
* Checks to see if the event code exists in the DB
*/
var doesEventCodeExist = function(eventCode, callback) {
    connection.query("SELECT count(event_code) AS event_exists from events WHERE event_code = ?", [eventCode], function (err, rows) {
        if (err) return callback(err);
        return callback(err, rows[0].event_exists);
    });
};

/*
* Inserts an event into the DB.
*/
var insertEvent = function(eCode, event, callback) {
    var stringQuery = "INSERT INTO events (event_code, opt_password, adm_password, start_date, end_date, location, description, email, event_name) VALUES ?";
    var values = [[eCode, event.optPassword, event.adminPassword, event.startDate, event.endDate, event.location, event.description, event.email, event.name]];

    connection.query(stringQuery, [values], function (err, result) {
        if(err) return callback(err);
        console.log(result);
        console.log("Number of records inserted: " + result.affectedRows);
        callback(err, eCode);
    });
};

/*
SELECT images.id, images.event_code, create_event.event_name, images.image_path, images.image_name, images.upload_date FROM images INNER JOIN create_event ON images.event_code=create_event.event_code
*/

module.exports = {
    clearDatabase: function (callback) {
        connection.query("DELETE FROM images", function (err, rows) {
            if (err) return callback(err);
            connection.query("DELETE FROM events", function (err, rows) {
                if (err) return callback(err);
                callback(err, rows);
            });
        });

    },
    doesEventCodeExist: function (eventCode, callback) {
        connection.query("SELECT count(event_code) AS event_exists from events WHERE event_code = ?", [eventCode], function (err, rows) {
            if (err) return callback(err);
            return callback(err, rows[0].event_exists);
        });
    },
    generateEventCode: function (callback) {
        var numbers = [];
        for (var i = 0; i <= 9999; i++) {
            numbers.push(i);
        }
        connection.query("SELECT event_code FROM events", function(err, rows) {
            if (err) return callback(err);
            rows.forEach(function(result) {
                var index = numbers.indexOf(result.event_code);
                if (index > -1) {
                    numbers.splice(index, 1);
                }
            });
            callback(err, Math.floor(Math.random() * numbers.length));
        });
    },
    
    /*
    * Retrieves information about an event by using the event code. 
    * Stores the information in an event object.
    */
    retrieveEventByEventCode: function (eventCode, callback) {
        connection.query("SELECT * FROM events WHERE event_code = ? ", [eventCode], function (err, rows) {
            if (err) return callback(err);

            var event = {};
            rows.forEach(function (result) {
                console.log(result);
                event.code = result.event_code;
                event.optPassword = result.opt_password;
                event.adminPassword = result.adm_password;
                event.location = result.location;
                event.startDate = result.start_date;
                event.endDate = result.end_date;
                event.description = result.description;
                event.email = result.email;
            });

            callback(err, event);
        });
    },
    
    /*
    * Retrieves images from DB with an event code.
    * Stores the image path to be used to retrieve actual image.
    */
    retrieveImagesByEventCode: function (eventCode, callback) {
        var images = [];
        console.log(eventCode);

        connection.query("SELECT image_path FROM images WHERE event_code =?", [eventCode], function (err, rows) {
            if (err) return callback(err);

            rows.forEach(function (result) {
                var image = {
                    path: result.image_path
                }
                images.push(image);
            });

            callback(err, images);
        })
    },
    
    /*
    * Retrieves images from DB with an image ID.
    * Stores the image path to be used to retrieve actual image.
    */
    retrieveImageById: function (eventCode,imageId, callback) {
        connection.query("SELECT * FROM images WHERE event_code = ? AND image_id = ?", [eventCode, imageId], function (err, rows) {
            console.log("retrieveImageById rows: " +rows);
            if (err) return callback(err);

            var image = {};
            rows.forEach(function (result) {
                console.log(result.image_path);
                image.path = result.image_path;
            });

            callback(err, image);
        })
    },
    
    /*
    * Generates and event code and checks if it doesn't exist
    * inserts event with newly generated code
    */
    insertEvent: function (event, callback) {
        this.generateEventCode(function(err, eventCode) {
            if(err) return callback(err);
            console.log("generated code: " + eventCode);
            var eCode = eventCode;
            if(event.hasOwnProperty("code")) {
                doesEventCodeExist(event.code, function(err, codeExists) {
                    if(err) callback(err);
                    if(!codeExists) eCode = event.code;
                    insertEvent(eCode, event, function(err, eCode) {
                        if(err) return callback(err);
                        callback(err, eCode);
                    });
                });
            } else {
                insertEvent(eCode, event, function(err, eCode) {
                    if(err) return callback(err);
                    callback(err, eCode);
                });
            }

        });
    },
    
    
    /*
    * Inserts new data into image table
    */
    insertImage: function (eventCode, image, callback) {
        var stringQuery = "INSERT INTO images (image_name, image_path, size, upl_date, event_code) VALUES ?";
        var values = [[image.name, image.path, image.size, new Date().toLocaleString(), eventCode]];

        connection.query(stringQuery, [values], function (err, result) {
            if (err) return callback(err);
            console.log(result);
            console.log("Number of records inserted: " + result.affectedRows);
            callback(err, result.insertId);
        });
    },
    /*
    * Updates and existing event.
    */
    updateEvent: function (eventCode, event, callback) {
        var stringQuery = "UPDATE events SET opt_password = ?, adm_password = ?, start_date = ?, end_date = ?, location = ?, description = ?, email = ? WHERE event_code = ?";
        var values = [event.optPassword, event.adminPassword, event.startDate, event.endDate, event.location, event.description, event.email, eventCode];
        connection.query(stringQuery, values, function (err, result) {
            if (err) return callback(err);
            console.log(result);
            callback(err, result);
        });
    },
    
    /*
    * Deletes an event by its code
    */
    deleteEventByEventCode: function (eventCode, callback) {
        connection.query("DELETE FROM events WHERE event_code = ?", [eventCode], function (err, rows) {
            if (err) return callback(err);
            callback(err, rows);
        });
    },
    
    /*
    * Deletes an image by its ID
    */
    deleteImageById: function (imageId, callback) {
        connection.query("DELETE FROM images WHERE image_id = ?", [imageId], function (err, rows) {
            if (err) return callback(err);
            console.log(rows);
            callback(err, rows);
        });
    }
};