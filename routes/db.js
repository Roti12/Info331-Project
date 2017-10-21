const mysql = require("mysql");
// const Image = require("../controllers/models/image");
const testDb = {
    host: "localhost",
    user: "root",
    password: "root",
    database: "info331test",
    port: 3306
};
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

var connection;
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
    retrieveEvent: function () {
        connection.query("SELECT * FROM create_event WHERE event_code =? ", [120321], function (err, rows) {
            if (err) {
                console.log(err);
                return;
            }

            rows.forEach(function (result) {
                console.log(result.event_code, result.password, result.adm_password, result.location, result.start_date, result.end_date, result.capacity, result.event_name);
            });
        })
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