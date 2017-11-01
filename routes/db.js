const mysql = require("mysql");
// const Image = require("../controllers/models/image");
const testDb = {
    host: "localhost",
    user: "root",
    password: "root",
    database: "info331test",
    port: 3306
};

//CREATE A POOL INSTEAD?
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

var connection = mysql.createConnection(prodDb)
if (process.env.NODE_ENV === 'test') {
    connection = mysql.createConnection(testDb);
} else {
    connection = mysql.createConnection(prodDb);
}

/*
SELECT images.id, images.event_code, create_event.event_name, images.image_path, images.image_name, images.upload_date FROM images INNER JOIN create_event ON images.event_code=create_event.event_code
*/

module.exports = {
    clearDatabase: function (callback) {
        connection.query("DELETE FROM images", function (err, rows) {
            if (err) {
                console.log(err);
                return next(err);
            }
            connection.query("DELETE FROM events", function (err, rows) {
                if (err) {
                    console.log(err);
                    return next(err);
                }
                callback();
            });
        });

    },
    retrieveEvent : function(eventCode, callback) {

      var tempObject = [];
      connection.query("SELECT * FROM create_event WHERE event_code =? ", [eventCode], function(err, rows) {
        if(err) {
            console.log(err);
            return;
        }

        rows.forEach(function(result) {
            tempObject = {
                eCode : result.event_code,
                pass : result.opt_password,
                admPass : result.adm_password,
                place : result.location,
                start : result.start_date,
                end : result.end_date,
                cap : result.capacity,
                desc : result.description
            }

        })

          callback(tempObject);

    })  
    },
    retrieveEventByEventCode: function (eventCode, callback) {
        connection.query("SELECT * FROM events WHERE event_code = ? ", [eventCode], function (err, rows) {
            if (err) {
                console.log(err);
                return next(err);
            }

            var event = {};
            rows.forEach(function (result) {
                console.log(result);
                event.code = result.event_code;
                event.optPassword = result.opt_password;
                event.adminPassword = result.admin_password;
                event.location = result.location;
                event.startDate = result.start_date;
                event.endDate = result.end_date;
                event.description = result.description;
            });

            callback(event);
        });
    },
    insertEvent: function (event) {
        var stringQuery = "INSERT INTO events (event_code, opt_password, admin_password, start_date, end_date, location, description) VALUES ?";
        var values = [[event.code, event.optPassword, event.adminPassword, event.startDate, event.endDate, event.location, event.description]];

        connection.query(stringQuery, [values], function (err, result) {
            if (err) throw err;
            console.log(result);
            console.log("Number of records inserted: " + result.affectedRows);
        });
    },
    insertImage: function (eventCode, image, callback) {
        var stringQuery = "INSERT INTO images (image_name, image_path, size, upl_date, event_code) VALUES ?";
        var values = [[image.name, image.path, image.size, new Date().toLocaleString(), eventCode]];

        connection.query(stringQuery, [values], function (err, result) {
            if (err) throw err;
            console.log(result);
            console.log("Number of records inserted: " + result.affectedRows);
            callback(result.insertId);
        });
    },

    retrieveImagesByEventCode: function (eventCode, callback) {
        var imagePathArray = [];
        console.log(eventCode);

        connection.query("SELECT image_path FROM images WHERE event_code =?", [eventCode], function (err, rows) {
            if (err) {
                console.log(err);
                return next(err);
            }

            rows.forEach(function (result) {
                imagePathArray.push(result.image_path);
            });

            callback(imagePathArray);
        })
    },

    retrieveImageById: function (eventCode,imageId, callback) {
        var imagePathArray = [];
        console.log(eventCode);

        connection.query("SELECT * FROM images WHERE event_code = ? AND id = ?", [eventCode, imageId], function (err, rows) {
            console.log("retrieveImageById rows: " +rows);
            if (err) {
                console.log(err);
                return next(err);
            }

            var image = {};
            rows.forEach(function (result) {
                console.log(result.image_path);
                image.path = result.image_path;
            });

            callback(image);
        })
    },

    doesEventCodeExist: function (eventCode, callback) {
        connection.query("SELECT count(event_code) AS event_exists from events WHERE event_code = ?", [eventCode], function (err, rows) {
            if (err) {
                console.error(err.stack);
                next(err);
            }
            callback(rows[0].event_exists);
        });
    }
};