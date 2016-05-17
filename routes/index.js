var express = require('express');
var router = express.Router();
var Twitter = require('twitter');
var db = require('../mongo.js');
var util = require('util');
var Tweet = require('../models/tweet');
var async = require('async');
var _ = require('lodash');
var stop = require('stopword');
var maps = require('googlemaps');
var SparqlClient = require('sparql-client');

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
      if(top[tweet.user.screen_name]) {
        top[tweet.user.screen_name] += 1;
        words[tweet.user.screen_name].push(stripText(tweet.text));
      }
      else {
        top[tweet.user.screen_name] = 1;
        words[tweet.user.screen_name] = stripText(tweet.text);
      }
    })
  else
    return null;

  return [getSortedKeys(top).reverse().slice(0,10),_.sortBy(top).reverse().slice(0,10), words];
}

function getWordFrequency(words) {
  var res = {};

  removeWords(words.join(' ')).map((word) => {
    if(res[word])
      res[word] += 1;
    else {
      res[word] = 1;
    }
  })
  return [getSortedKeys(res).reverse().slice(0,10),_.sortBy(res).reverse().slice(0,10)];
}

function removeWords(text) {
  return stop.removeStopwords(text, [{stopwords: stop.getStopwords('en')}]);
}

function getFrequency(tweets) {
  var res = {};

  if(tweets.length > 0) {
    tweets.map((tweet) => {
      var words = stripText(tweet.text);
      words = removeWords(words.join(' '));
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

function getPlaces(tweets) {
  var res = [];
  tweets.map(function(tweet) {
    if(tweet.place) {
      var coords = tweet.place.bounding_box.coordinates[0];
      var coord_lat = 0; var coord_long = 0;
      coords.map(function(item) {
        coord_lat += item[0];
        coord_long += item[1];
      })
      res.push([coord_lat/coords.length, coord_long/coords.length]);
    }
  })
  return res;
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

router.post('/research', function(req, res, next) {
  // SPARQL
  var endpoint = 'http://dbpedia.org/sparql';
  var sparq = 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> '+
    'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> '+
    'PREFIX : <http://dbpedia.org/resource/> '+
    'PREFIX dbpedia2: <http://dbpedia.org/property/> '+
    'PREFIX dbpedia: <http://dbpedia.org/> '+
    'PREFIX dbo: <http://dbpedia.org/ontology/> '+
    ' SELECT ?f ?clubname ?abstract ?manager ?ground ?name ?pos ?bd ?thumb'+
    ' WHERE {'+
    '?f rdf:type dbo:SoccerClub . '+
    '?f dbpedia2:clubname ?clubname . '+
    '?f dbpedia2:name ?name . '+
    '?f dbpedia2:ground ?ground . '+
    '?f dbo:abstract ?abstract . '+
    '?f dbo:manager ?manager . '+
    '?name dbo:position ?pos . '+
    '?name dbo:birthDate ?bd . '+
    '?name dbo:thumbnail ?thumb ' +
    'FILTER (regex (?clubname, "'+req.body.query+'", "i") && (langMatches(lang(?abstract),"en"))) }';

  var dbpedia = new SparqlClient(endpoint);

  dbpedia.query(sparq).bind('team', '<http://dbpedia.org/resource/Manchester_United_F.C.>').execute(function(error, results) {
    console.log(util.inspect(results, null, 20, true)+"\n");
  });

  res.send('plm');
})

router.post('/', function(req, res, next) {
  var status = [];

  if(req.body.query == -1) {
    status.push('Query can only have AND or OR');
    res.send([status]);
  }
  else {
    var query = '';
    var data = {};

    if(req.body.authors.length > 0) {
      //data['authors'] = req.body.authors;
      req.body.authors.map(function(item, index) {
        query += `from:${item} `;
      })
    }
    if(req.body.mentions.length > 0)
      //data['mentioned'] = req.body.mentions;
      req.body.mentions.map(function(item, index) {
        query += `@${item} `;
      })
    if(req.body.hashtags.length > 0)
      //data['hashtags'] = req.body.hashtags;
      req.body.hashtags.map(function(item, index) {
        query += `#${item} `;
      })
    if(req.body.keywords.length > 0)
      //data['keywords'] = req.body.keywords;
      req.body.keywords.map(function(item, index) {
        query += `${item} `;
      })

    var options = {};

    // Get authors from query
    if(req.body.authors.length > 0)
      options['user.screen_name'] = {$in: req.body.authors};

    // Get mentioned users from query
    if(req.body.mentions.length > 0)
      if(req.body.query == 0)
        options['mentioned_users.screen_name'] = {$in: req.body.mentions};
      else {
        options['mentioned_users.screen_name'] = {$all: req.body.mentions};
      }

    // Get hashtags from query
    if(req.body.hashtags.length > 0)
      if(req.body.query == 0)
        options['hashtags'] = {$in: req.body.hashtags};
      else if(req.body.query == 1) {
        options['hashtags'] = {$all: req.body.hashtags};
      }

    // Get keywords from query
    if(req.body.keywords.length > 0)
      if(req.body.query == 0)
        options['keywords'] = {$in: req.body.keywords};
      else if(req.body.query == 1) {
        options['keywords'] = {$all: req.body.keywords};
      }

    query = query.trim();

    if(req.body.query == 0) {
      query = query.replace(/ /g , " OR ");
      var params = options;
    }
    else {
      query = query.replace(/ /g , " AND ");
      var params = {$and: [options]};
    }

    console.log(options);

    //console.log(removeWords('the sugi pula the'));
    Tweet.find(params).lean().sort({id_str: -1}).exec(function(err, tweets) {

      var final_tweets = [];

      if(tweets.length > 0) {
        console.log('Found '+tweets.length+' in database.');
        if(!req.body.dbOnly)
          console.log('Fetching tweets newer than '+tweets[0].id_str);
        tweets.map(function(item) {
          final_tweets.push(item);
          // console.log(item.text);
          // console.log("ID is "+item.id_str);
        })
        var twitter_params = { q: query, count: 300, lang: "en-gb", since_id: tweets[0].id_str };
      }
      else {
        var twitter_params = { q: query, count: 300, lang: "en-gb" };
        console.log('No tweets found in database.')
        if(!req.body.dbOnly)
          console.log('Fetching all.');
      }

      if(!req.body.dbOnly) {

        client.get('search/tweets', twitter_params, function(err, data, response) {
          if(err) throw err;

          var tweets = JSON.parse(response.body).statuses;
          //console.log(util.inspect(tweets,  { showHidden: true, depth: null }));
          //console.log(tweets[0]);

          var count = 0;

          tweets.map((item) => {
            final_tweets.push(item);
            var mentioned_users = [];
            var tags = [];

            if(item.entities.user_mentions)
              item.entities.user_mentions.map((user) => {
                mentioned_users.push({screen_name: user.screen_name.toLowerCase(), name: user.name});
              });

            if(item.entities.hashtags)
              item.entities.hashtags.map((tag) => {
                var txt = tag.text;
                var txt = txt.toLowerCase();
                tags.push(txt);
              });

            //console.log(stripText(item.text));
            var tweet = new Tweet({
              id_str: item.id_str,
              text: item.text,
              created_at: item.created_at,
              source: item.source,
              user: {
                screen_name: item.user.screen_name.toLowerCase(),
                name: item.user.name,
                profile_image_url: item.user.profile_image_url
              },
              mentioned_users: mentioned_users,
              location: item.place?{
                full_name: item.place.full_name,
                country_code: item.place.country_code,
                coordinates: item.place.bounding_box.coordinates[0]
              }:null,
              hashtags: tags,
              keywords: stripText(item.text)
            });
            //console.log(util.inspect(item,  { showHidden: true, depth: null }));
            tweet.save(function(err) {
              if (err) {
                console.log(err);
              }
              //console.log('saved '+count);
            });
            count += 1;
          });

          var users = getMostActive(final_tweets);
          var keywds = users[2];
          var active = [];
          users[0].map((author) => {
            active.push(getWordFrequency(flatten(keywds[author])));
          })
          status.push('Retrieved '+final_tweets.length+' tweets');

          console.log("Added "+count+" entries to database");
          res.send([status, final_tweets, getFrequency(final_tweets), [active, users[0], users[1]], getPlaces(final_tweets)]);
        })
      } else {
        var users = getMostActive(final_tweets);
        var keywds = users[2];
        var active = [];
        users[0].map((author) => {
          active.push(getWordFrequency(flatten(keywds[author])));
        })
        status.push('Retrieved '+final_tweets.length+' tweets');
        res.send([status, final_tweets, getFrequency(final_tweets), [active, users[0], users[1]], getPlaces(final_tweets)]);
      }
    })

  }


  //if(req.body.authors.length > 0) {




    /*
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
                      mentioned_users.push({screen_name: user.screen_name.toLowerCase(), name: user.name});
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
    */
  //}
  //else { status.push('nothing happened'); res.send([[], status]); }
});

module.exports = router;
