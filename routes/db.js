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
  connection.query("select * from create_event where event_code =? ", [120321], function(err, rows) {
    if(err) {
        console.log(err);
        return;
    }
    
    rows.forEach(function(result) {
        console.log(result.event_code, result.password, result.adm_password, result.location, result.start_date, result.end_date, result.capacity, result.event_name);
    })
    
    connection.end(function() {
        console.log("Connection closed");
    })
})  
}
}