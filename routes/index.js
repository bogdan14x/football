var express = require('express');
var router = express.Router();
var mysql = require('mysql');
//var twitter = require('./twitter');
var Twitter = require('twitter');
var io = require('socket.io');

process.env['CONSUMER_KEY'] = "45L6FVra0MgX063EpMaa1bEpJ";
process.env['CONSUMER_SECRET'] = "z3j3Ghy2JL91Fl9YaaxwOdCxQzvO9BtzoY4mDZWofB6Z0JD3Dw";
process.env['ACCESS_TOKEN_KEY'] = "709029214138327041-dwkfJSROp56BaulXN02Elrx2lOK05CU";
process.env['ACCESS_TOKEN_SECRET'] = "lVh9AZvoHGJMCRb5aRkBy4mSHDCrG3knZKBIHKIME15XR";

var client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {title: 'TweetBall'});
});

router.post('/', function(req, res, next) {
  res.send('started');
});

router.post('/stream', function(req, res, next) {
  //twitter(req.body.keyword);
  res.send('Tweets containing '+req.body.keyword);
  io.on('connect', function(socket) {
    client.stream('statuses/filter', {track: req.body.keyword},  function(stream) {
      stream.on('data', function(tweet) {
        socket.emit('tweet', {
          text: tweet.text
        });
      });

      stream.on('error', function(error) {
        console.log(error);
      });
    });
  });
});

module.exports = router;

var connection = mysql.createConnection({
  host     : 'stusql.dcs.shef.ac.uk',
  user     : 'team056',
  password : '8e7346a4',
  database : 'team056'
});
