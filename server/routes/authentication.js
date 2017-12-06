module.exports = {
    
    authenticate: function(stringInput, optPassword, admPassword) {
        console.log("Input: " + stringInput + ", optPW: " + optPassword + ", adminPW: " + admPassword);
        if(stringInput === optPassword || stringInput === admPassword) return true;
        else return false;
    }
    
    
}