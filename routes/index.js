var express = require('express');
var router = express.Router();
var Twitter = require('twitter');
var db = require('../mongo.js');
var util = require('util');
var Tweet = require('../models/tweet');
var async = require('async');
var _ = require('lodash');
var maps = require('googlemaps');

process.env['CONSUMER_KEY'] = "45L6FVra0MgX063EpMaa1bEpJ"
process.env['CONSUMER_SECRET'] = "z3j3Ghy2JL91Fl9YaaxwOdCxQzvO9BtzoY4mDZWofB6Z0JD3Dw"
process.env['ACCESS_TOKEN_KEY'] = "709029214138327041-dwkfJSROp56BaulXN02Elrx2lOK05CU"
process.env['ACCESS_TOKEN_SECRET'] = "lVh9AZvoHGJMCRb5aRkBy4mSHDCrG3knZKBIHKIME15XR"
process.env['MAPS_KEY'] = 'AIzaSyBrRJZEUbENOOTQpMTx3R3hWf30-i8g7fg';

var client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

function stripText(text) {
  var word = /(\w+)(?!\w)/g, words = [];
  var stripped = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').toLowerCase();
  while (match = word.exec(stripped)) {
    words.push(match[1]);
  }
  return words;
}

function getMostActive(tweets) {
  top = {}; words = {};
  if(tweets)
    tweets.map((tweet) => {
      if(top[tweet.author.screen_name]) {
        top[tweet.author.screen_name] += 1;
        words[tweet.author.screen_name].push(stripText(tweet.text));
      }
      else {
        top[tweet.author.screen_name] = 1;
        words[tweet.author.screen_name] = stripText(tweet.text);
      }
    })
  else
    return null;

  return [getSortedKeys(top).reverse().slice(0,10),_.sortBy(top).reverse().slice(0,10), words];
}

function getWordFrequency(words) {
  var res = {};
  words.map((word) => {
    if(res[word])
      res[word] += 1;
    else {
      res[word] = 1;
    }
  })
  return [getSortedKeys(res).reverse().slice(0,10),_.sortBy(res).reverse().slice(0,10)];
}

function getFrequency(tweets) {
  var res = {};

  if(tweets.length > 0) {
    tweets.map((tweet) => {
      var words = stripText(tweet.text);
      words.map((word)  => {
        if(res[word])
          res[word] += 1;
        else {
          res[word] = 1;
        }
      })
    })
  }
  else return null;
  return [getSortedKeys(res).reverse().slice(0,20),_.sortBy(res).reverse().slice(0,20)];
}

function getSortedKeys(obj) {
  var keys = []; for(var key in obj) keys.push(key);
  return keys.sort(function(a,b){return obj[a]-obj[b]});
}

function flatten(x) {
  if (x.length == 0) {return []};
  if (Array.isArray(x[0])) {
    return flatten(x[0].concat(flatten(x.slice(1,x.length))));
  }
  return [].concat([x[0]], flatten(x.slice(1,x.length)));
}

router.get('/', function(req, res, next) {
  res.render('index', {title: 'TweetBall'});
});

router.post('/', function(req, res, next) {
  var status = [];

  function getResults(options, status) {
    Tweet.find(options).lean().exec(function(err, tweets) {
      if (err) throw err;
      //console.log(getFrequency(tweets));
      //status.push(tweets.length+' tweets found');
      return tweets;
    });
  }

  if(req.body.authors.length > 0) {

    var options = {'author.screen_name': {$in: req.body.authors}};

    if(req.body.mentions.length > 0) options['mentioned_users.screen_name'] = {$in: req.body.mentions};
    if(req.body.hashtags.length > 0) options['hashtags.text'] = {$in: req.body.hashtags};
    if(req.body.keywords.length > 0) options['keywords'] = {$in: req.body.keywords};

    if(req.body.dbOnly) {
      console.log('db only');
      var active = [];
      console.log(options);
      Tweet.find(options).lean().exec(function(err, tweets) {
        if (err) throw err;

        function sendIt() {
          status.push(tweets.length+' tweets found in DB');
          console.log(util.inspect(tweets,  { showHidden: true, depth: null }));
          res.send([tweets, status, getFrequency(tweets), [active, users[0], users[1]]]);
        }
        // get most active users
        var users = getMostActive(tweets);
        var keywds = users[2];
        start(sendIt);
        function start(callback) {
          //console.log('enter');
          users[0].map((author) => {
            active.push(getWordFrequency(flatten(keywds[author])));
          })
          callback();
        }
      });
    }
    else {
      var id_list = [];

      async.each(req.body.authors,
        function(screen_name, callback) {
          Tweet.find({'author.screen_name': screen_name}).sort({'_id': 1}).lean().limit(1).exec(function(err, tweet) {
            if (err) throw err;

            if(tweet.length > 0) {
              id_list[screen_name] = {screen_name: screen_name, since_id: tweet[0].id_str, new_tweets: true, count: 150};
            } else {
              id_list[screen_name] = {screen_name: screen_name, new_tweets: false, count: 150};
            }

            callback();
          })
        },
        function(err) {
          var tasks = [];
          req.body.authors.forEach(function(screen_name) {
            tasks.push(function(callback) {
              client.get('statuses/user_timeline', id_list[screen_name], function(err, data, response) {
                if(err) {
                  status.push(err[0].message);
                  callback(null);
                  return null;
                }

                data.map((item) => {
                  var urls = [];
                  var mentioned_users = [];
                  var imgs = [];
                  var tags = [];

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

                  if(item.entities.hashtags)
                    item.entities.hashtags.map((tag) => {
                      var txt = tag.text;
                      var txt = txt.toLowerCase();
                      tags.push({text: txt});
                    });

                  //console.log(stripText(item.text));
                  var tweet = new Tweet({
                    id_str: item.id_str,
                    text: item.text,
                    created_at: item.created_at,
                    retweet_count: item.retweet_count,
                    favorite_count: item.favorite_count,
                    source: item.source,
                    author: {
                      screen_name: item.user.screen_name.toLowerCase(),
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
                    images: imgs,
                    hashtags: tags
                  });
                  //console.log(util.inspect(item,  { showHidden: true, depth: null }));
                  tweet.save(function(err) {
                    if (err) {
                      console.log(err);
                    }
                    //console.log('saved '+count);
                    //count += 1;
                  });
                });
                status.push((id_list[screen_name].new_tweets)?
                  ((data.length > 0)?('added '+data.length+' NEW tweets for user @'+screen_name):('no new tweets for user @'+screen_name)):
                  ('user @'+screen_name+' now has '+ data.length+' tweets in the DB'));
                //console.log(status);
                callback(null, data);
              });
            })
          })

          //console.log(util.inspect(tasks,  { showHidden: true, depth: null }));
          async.parallel(tasks, function(err, data) {
            var active = [];
            //var flat = flatten(data);
            console.log(data.length);
            Tweet.find(options).lean().exec(function(err, tweets) {

              var users = getMostActive(tweets);
              //console.log(tweets);
              if(users != null) {
                var keywds = users[2];
                users[0].map((author) => {
                  active.push(getWordFrequency(flatten(keywds[author])));
                })
              }
              //status.push(tweets.length+' tweets retrieved in total');

              res.send([tweets, status, getFrequency(tweets), [active, users[0], users[1]]]);

            })

            //console.log(flatten(data));
          })
        }
      );
    }
  }
  else { status.push('nothing happened'); res.send([[], status]); }
});

module.exports = router;
