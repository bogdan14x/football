var express = require('express');
var app = express();
var path = require('path');
var logger = require('morgan');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var router  = express.Router();
var Twit = require('twit');

process.env['CONSUMER_KEY'] = "45L6FVra0MgX063EpMaa1bEpJ"
process.env['CONSUMER_SECRET'] = "z3j3Ghy2JL91Fl9YaaxwOdCxQzvO9BtzoY4mDZWofB6Z0JD3Dw"
process.env['ACCESS_TOKEN'] = "709029214138327041-dwkfJSROp56BaulXN02Elrx2lOK05CU"
process.env['ACCESS_TOKEN_SECRET'] = "lVh9AZvoHGJMCRb5aRkBy4mSHDCrG3knZKBIHKIME15XR"

var T = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  timeout_ms: 60*1000
});

app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));

server.listen(3000);

app.set('views', './views');
app.set('view engine', 'jade');

app.use('/', router);

router.get('/', function (req, res) {
  res.render('index', {title: 'TweetBall'});
});

io.on('connection', function(socket) {
  console.log('connected');

  socket.on('keyword', function(data) {
    var stream = T.stream('statuses/filter', {track: data.keyword});
    //console.log(data.keyword);
    stream.on('tweet', function (tweet) {
      socket.emit('tweet', {text: tweet.text});
    })
  });
});
