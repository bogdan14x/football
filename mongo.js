
process.env['MONGO_USER'] = "bogdan14x";
process.env['MONGO_PASS'] = "awesomesauce";

var mongoose = require('mongoose');
mongoose.connect('mongodb://'+process.env.MONGO_USER+':'+process.env.MONGO_PASS+'@jello.modulusmongo.net:27017/zagy7qYh');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected to DB!');
});

module.exports = db;
