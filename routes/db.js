const mysql = require("mysql");

const connection = mysql.createConnection({
   
    host: "sql11.freemysqlhosting.net",
    user: "sql11198291",
    password: "rWNaHXbxq6",
    database: "sql11198291",
    port: 3306,
    
    
    //dev-range-182012:europe-west1:eventphotodb
    //root
    //thisisnotkahoot
});

/*
SELECT images.id, images.event_code, create_event.event_name, images.image_path, images.image_name, images.upload_date FROM images INNER JOIN create_event ON images.event_code=create_event.event_code
*/

module.exports = {
retrieveEvent : function() {
  connection.query("SELECT * FROM create_event WHERE event_code =? ", [120321], function(err, rows) {
    if(err) {
        console.log(err);
        return;
    }
    
    rows.forEach(function(result) {
        console.log(result.event_code, result.password, result.adm_password, result.location, result.start_date, result.end_date, result.capacity, result.event_name);
    })
    
})  
},
    insertImage : function(arrayValues) {
        var stringQuery = "INSERT INTO image_table (image_name, image_path, size, upl_date, event_code) VALUES ?";
        var eventCode = 1000;
        var values = [[arrayValues[0], arrayValues[1], arrayValues[2], new Date().toLocaleString(), eventCode]];
        
        connection.query(stringQuery, [values], function(err, result){
            if(err) throw err;
            console.log("Number of records inserted: " + result.affectedRows);
        })
    },
    
    retrieveImagesByEventCode : function(eventCode, callback) {
        var imagePathArray = [];
        connection.query("SELECT image_path FROM image_table WHERE event_code =?", [eventCode], function(err, rows) {
            if(err) {
                console.log(err);
                return;
            }
            
            rows.forEach(function(result){
                imagePathArray.push(result.image_path); 
            })
            
            callback(imagePathArray);
        })
    
    }
}