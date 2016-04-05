var express = require('express');
var router = express.Router();
var Twitter = require('twitter');
var db = require('../mongo.js');
var util = require('util');
var Tweet = require('../models/tweet');

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

router.get('/', function(req, res, next) {
  res.render('index', {title: 'TweetBall'});
});

router.post('/', function(req, res, next) {
  if(req.body.screen_name) {
    if(req.body.dbOnly) {
      console.log('db only');
      Tweet.find({'author.screen_name': req.body.screen_name}).lean().exec(function(err, tweets) {
        if (err) throw err;
        //console.log(tweets);
        res.send([tweets, (tweets.length+' tweets found for user @'+req.body.screen_name)]);
      });
    }
    else {
      Tweet.find({'author.screen_name': req.body.screen_name}).sort({'_id': 1}).lean().limit(1).exec(function(err, tweet) {
        if (err) throw err;
        //console.log(tweet);
        if(tweet.length > 0) {
          var options = {screen_name: req.body.screen_name, since_id: tweet[0].id_str};
          var newTweets = true;
          //console.log('id is '+tweet.id_str);
        } else {
          var options = {screen_name: req.body.screen_name};
          var newTweets = false;
        }

        client.get('statuses/user_timeline', options, function(err, data, response) {
          data.map((item) => {
            var urls = [];
            var mentioned_users = [];
            var imgs = [];

            if(item.entities.urls)
              item.entities.urls.map((url) => {
                urls.push({url: url.url, expanded_url: url.expanded_url});
              });

            if(item.entities.user_mentions)
              item.entities.user_mentions.map((user) => {
                mentioned_users.push({screen_name: user.screen_name, name: user.name});
              });

            if(item.entities.media)
              item.entities.media.map((image) => {
                imgs.push({img_url: image.media_url, display_url: image.display_url});
              });

            var tweet = new Tweet({
              id_str: item.id_str,
              text: item.text,
              created_at: item.created_at,
              retweet_count: item.retweet_count,
              favorite_count: item.favorite_count,
              source: item.source,
              author: {
                screen_name: item.user.screen_name,
                name: item.user.name,
                profile_image_url: item.user.profile_image_url
              },
              urls: urls,
              mentioned_users: mentioned_users,
              location: item.place?{
                type: item.place.place_type,
                full_name: item.place.full_name,
                country_code: item.place.country_code,
                coordinates: item.place.bounding_box.coordinates[0]
              }:null,
              images: imgs
            });
            //console.log(util.inspect(item,  { showHidden: true, depth: null }));
            tweet.save(function(err) {
              if (err) throw err;
            });
          });
          res.send([data, newTweets?
            ((data.length > 0)?('added '+data.length+' NEW tweets for user @'+req.body.screen_name):('no new tweets for user @'+req.body.screen_name)):
            ('user @'+req.body.screen_name+' now has '+ data.length+' tweets in the DB')]);
        });
      });
    }
  }
  else { res.send([[],'nothing happened']); }
});

module.exports = router;
