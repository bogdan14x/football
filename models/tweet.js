var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var author = new Schema({
  screen_name: String,
  name: String,
  profile_image_url: String
});

var media = new Schema({
  img_url: String,
  display_url: String
});

var mentionedUser = new Schema({
  screen_name: String,
  name: String
})

var url = new Schema({
  url: String,
  expanded_url: String
})

var coords = new Schema({
  coords_lat: Number,
  coords_long: Number
});

var tweetLocation = new Schema({
  type: String,
  full_name: String,
  country_code: String,
  coordinates: [coords]
})
var tweet = new Schema({
  id_str: String,
  text: String,
  created_at: Date,
  retweet_count: Number,
  favorite_count: Number,
  source: String,
  author: author,
  urls: [url],
  mentioned_users: [mentionedUser],
  location: tweetLocation,
  images: [media]
});

var Tweet = mongoose.model('Tweet', tweet);

module.exports = Tweet;
