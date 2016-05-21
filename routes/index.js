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
    ' SELECT ?f ?clubname ?abstract ?manager ?ground ?name ?pos ?bd ?thumb ?stadium_desc ?manthumb ?stadium_thumb'+
    ' WHERE {'+
    '?f rdf:type dbo:SoccerClub . '+
    '?f dbpedia2:clubname ?clubname . '+
    '?f dbpedia2:name ?name . '+
    '?f dbpedia2:ground ?ground . '+
    '?f dbo:abstract ?abstract . '+
    '?f dbo:manager ?manager . '+
    '?manager dbo:thumbnail ?manthumb . '+
    '?name dbo:position ?pos . '+
    '?name dbo:birthDate ?bd . '+
    '?name dbo:thumbnail ?thumb . ' +
    '?ground dbo:abstract ?stadium_desc . ' +
    '?ground dbo:thumbnail ?stadium_thumb ' +
    'FILTER (regex (?clubname, "'+req.body.query+'", "i") && (langMatches(lang(?abstract),"en")) && (langMatches(lang(?stadium_desc),"en"))) }';

  var dbpedia = new SparqlClient(endpoint);

  dbpedia.query(sparq).execute(function(error, data) {

    if(data.results.bindings.length > 0) {
      var clubname = data.results.bindings[0].clubname.value;
      var abstract = data.results.bindings[0].abstract.value;
      var manager = data.results.bindings[0].manager.value;
      var manager_thumb = data.results.bindings[0].manthumb.value;
      manager = manager.match(/([A-Z])\w+[a-zA-Z0-9 -]/g);
      var ground = data.results.bindings[0].ground.value;
      ground = ground.match(/([A-Z])\w+[a-zA-Z0-9 -]/g);

      var stadium_desc = data.results.bindings[0].stadium_desc;
      var stadium_thumb = data.results.bindings[0].stadium_thumb;

      var players = [];
      data.results.bindings.map(function(item) {
        var player_name = item.name.value;
        player_name = player_name.match(/([A-Z])\w+[a-zA-Z0-9 -]/g);
        var position = item.pos.value;
        console.log(item);
        position = position.match(/([A-Z])\w+[a-zA-Z0-9 -]/g);
        var bd = item.bd.value;
        var thumb = item.thumb.value;

        players.push({name: String(player_name).replace(/_/g, " "), position: String(position).replace(/_/g, " "), birthdate: bd, picture: thumb});
      })

      res.send({clubname: clubname, abstract: abstract, manager: String(manager).replace(/_/g, " "), ground: String(ground).replace(/_/g, " "), players: players, stadium_desc: stadium_desc, stadium_thumb: stadium_thumb, manthumb: manager_thumb});
    } else {
      res.send(["Not found"]);
    }
  });
})

router.post('/', function(req, res, next) {
  var status = [];

  if(req.body.query == -1) {
    status.push('Invalid query');
    res.send([status]);
  }
  else {
    var query = '';
    var data = {};
    var options = [];

    // Get authors from query
    if(req.body.authors.length > 0)
      options.push({'user.screen_name': {$in: req.body.authors}});

    // Get mentioned users from query
    if(req.body.mentions.length > 0)
      if(req.body.query == 0)
        options.push({'mentioned_users': {$in: req.body.mentions}});
      else if(req.body.query == 1) {
        options.push({'mentioned_users': {$all: req.body.mentions}});
      }
    console.log('query is '+req.body.query);
    // Get hashtags from query
    if(req.body.hashtags.length > 0)
      if(req.body.query == 0)
        options.push({'hashtags': {$in: req.body.hashtags}});
      else if(req.body.query == 1) {
        options.push({'hashtags': {$all: req.body.hashtags}});
      }

    // Get keywords from query
    if(req.body.keywords.length > 0)
      if(req.body.query == 0)
        options.push({'keywords': {$in: req.body.keywords}});
      else if(req.body.query == 1) {
        options.push({'keywords': {$all: req.body.keywords}});
      }

    if(Object.getOwnPropertyNames(options).length == 0) {
      status.push('Invalid query');
      res.send([status]);
    } else {

      if(req.body.authors.length > 0)
        req.body.authors.map(function(item, index) {
          query += `from:${item} `;
        })
      if(req.body.mentions.length > 0)
        req.body.mentions.map(function(item, index) {
          query += `@${item} `;
        })
      if(req.body.hashtags.length > 0)
        req.body.hashtags.map(function(item, index) {
          query += `#${item} `;
        })
      if(req.body.keywords.length > 0)
        req.body.keywords.map(function(item, index) {
          query += `${item} `;
        })

      query = query.trim();

      if(req.body.query == 1) {
        query = query.replace(/ /g , " AND ");
        var params = {$and: options};
      }
      else {
        query = query.replace(/ /g , " OR ");
        var params = {$or: options};
      }

      console.log(params);

      Tweet.find(params).lean().exec(function(err, tweets) {

        var final_tweets = [];
        //console.log(tweets);
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
                  mentioned_users.push(user.screen_name.toLowerCase());
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
  }
});

module.exports = router;
