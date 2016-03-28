var Twitter = require('twitter');

process.env['CONSUMER_KEY'] = "45L6FVra0MgX063EpMaa1bEpJ"
process.env['CONSUMER_SECRET'] = "z3j3Ghy2JL91Fl9YaaxwOdCxQzvO9BtzoY4mDZWofB6Z0JD3Dw"
process.env['ACCESS_TOKEN_KEY'] = "709029214138327041-dwkfJSROp56BaulXN02Elrx2lOK05CU"
process.env['ACCESS_TOKEN_SECRET'] = "lVh9AZvoHGJMCRb5aRkBy4mSHDCrG3knZKBIHKIME15XR"
var client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

module.exports = function(term) {
  client.stream('statuses/filter', {track: term},  function(stream) {
    stream.on('data', function(tweet) {
      console.log(tweet.text);
    });

    stream.on('error', function(error) {
      console.log(error);
    });
  });
}
