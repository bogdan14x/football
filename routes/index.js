var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var Twit = require('twit')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {title: 'TweetBall'});
});

router.post('/', function (req, res) {
  var stream = T.stream('statuses/filter', { track: ['husky', 'oranges', 'strawberries'] })

  stream.on('tweet', function (tweet) {
    console.log(tweet.text);
  })
});


module.exports = router;


var connection = mysql.createConnection({
  host     : 'stusql.dcs.shef.ac.uk',
  user     : 'team056',
  password : '8e7346a4',
  database : 'team056'
});

var T = new Twit({
  consumer_key:         '45L6FVra0MgX063EpMaa1bEpJ',
  consumer_secret:      'z3j3Ghy2JL91Fl9YaaxwOdCxQzvO9BtzoY4mDZWofB6Z0JD3Dw',
  access_token:         '709029214138327041-dwkfJSROp56BaulXN02Elrx2lOK05CU',
  access_token_secret:  'lVh9AZvoHGJMCRb5aRkBy4mSHDCrG3knZKBIHKIME15XR',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})
