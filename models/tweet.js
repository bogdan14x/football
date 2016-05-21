var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var author = new Schema({
  screen_name: String,
  name: String,
  profile_image_url: String
});

var coords = new Schema({
  coords_lat: Number,
  coords_long: Number
});

var tweetLocation = new Schema({
  full_name: String,
  country_code: String,
  coordinates: [coords]
})

var mentionedUser = new Schema({
  screen_name: String,
  name: String
})

var tweet = new Schema({
  id_str: String,
  text: String,
  created_at: Date,
  source: String,
  user: author,
  mentioned_users: [String],
  location: tweetLocation,
  hashtags: [String],
  keywords: [String]
});

var Tweet = mongoose.model('Tweet', tweet);

module.exports = Tweet;
