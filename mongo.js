var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/twitball');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected to DB!');
});

module.exports = db;
