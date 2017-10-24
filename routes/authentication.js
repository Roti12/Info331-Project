const db = require('./db.js');



module.exports = {
    
    checkForPassword : function(eventCode, callback) {
        var boolean;
        
        db.retrieveEvent(eventCode, function(data) {
                checkData(data); 
                callback(boolean);
            
        });
        
        
        function checkData(data) {
            
            if(data.pass === "" || typeof data.pass === "undefined") {
                boolean = false;
            } else {
                boolean = true;
            }
        }

    },
    
    
    checkIfCorrectlyEntered : function(eventCode, input, callback) {
        var boolean; 
        
        db.retrieveEvent(eventCode, function(data) {
            authenticate(input, data.pass, data.admPass);
            callback(boolean);
        });
        
        function authenticate(stringInput, optPassword, admPassword) {
            if(stringInput === optPassword || stringInput === admPassword) boolean = true;
            else boolean = false;
        }
        
            
    },
    
    
}