
function getQueryData() {
  var dbOnly = $('input[name=dbOnly]').is(':checked');
  var query = $('#query').val();
  var author = /author: ?@(\w+)(?!\w)/g, authors = [];
  var mention = /mention: ?@(\w+)(?!\w)/g, mentions = [];
  var tag = /#(\w+)(?!\w)/g, hashtags = [];
  var keyword = /'(\w+)'(?!\w)/g, keywords = [];

  while (match = author.exec(query)) {
    authors.push(match[1].toLowerCase());
  }
  while (match = mention.exec(query)) {
    mentions.push(match[1].toLowerCase());
  }
  while (match = tag.exec(query)) {
    hashtags.push(match[1].toLowerCase());
  }
  while (match = keyword.exec(query)) {
    keywords.push(match[1].toLowerCase());
  }
  var str_or = query.indexOf(' OR ');
  var str_and = query.indexOf(' AND ');
  var result = -2;
  if(str_or > 0 && str_and < 0)
    result = 0;
  if(str_and > 0 && str_or < 0)
    result = 1;
  if(str_and >= 0 && str_or >= 0)
    result = -1;
  if(str_and < 0 && str_or < 0)
    result = 0;


  return {keywords: keywords, authors: authors, hashtags: hashtags, mentions: mentions, dbOnly: dbOnly, query: result};
}


function renderLocations(data) {
  data.map(function(location) {
    console.log(location);
    var marker = new google.maps.Marker({
      position: {lat: location[1], lng: location[0]},
      map: map,
      icon: '/img/marker.png'
    });
  })
}

function renderTweets(data) {
  if(data) {
    $('#result-tweets').empty();
    $('#tweets .main-wrap').addClass('overflow-fix');
    data.map(function(tweet) {
      var date = moment(Date.parse(tweet.created_at)).format('ddd DD-MM-YYYY, hh:mm:ss');
      var result = '<div class="tweet"><span class="name">'+tweet.user.name+':</span><span class="text">'+tweet.text+'</span><div class="tweet-date">'+date+'</div></div>';
      $('#result-tweets').append(result);
    });
  } else {
    $('#result-tweets').empty();
    $('#result-tweets').append('No tweets found.');
  }
}

function renderUsers(data) {
  if(data) {
    var words = data[0];
    var names = data[1];
    var scores = data[2];
    var length = data[1].length;
    //console.log(words[0]);
    $('#user-result').empty();
    $('#users .main-wrap').addClass('overflow-fix');
    for(var i=0; i<length; i++) {
      var result = '<div style="font-size:1.4em;">@'+names[i]+' - '+scores[i]+' tweets</div>';
      $('#user-result').append(result);
      var temp = words[i];
      var temp_word = temp[0];
      var temp_val = temp[1];
      for(var j=0; j<temp_word.length; j++) {
        var stat = '<div class="col-xs-12"><span>'+temp_word[j]+'</span><span style="float: right;">'+temp_val[j]+'</span></div>';
        $('#user-result').append(stat);
      }
    }
  } else {
      $('#user-result').empty();
      $('#user-result').append('No results');
  }
}

function renderWords(data) {
  if(data) {
    var words = data[0];
    var vals = data[1];
    $('#word-result').empty();
    $('#words .main-wrap').addClass('overflow-fix');
    for(var i=0; i<words.length; i++) {
      var stat = '<div class="col-xs-12"><span>'+words[i]+'</span><span style="float: right;">'+vals[i]+'</span></div>';
      $('#word-result').append(stat);
    }
  }
  else {
    $('#word-result').empty();
    $('#word-result').append('No results.');
  }
}

function renderStatus(data) {
  $('.status').empty();
  data.map(function(msg) {
    $('.status').append('<div>'+msg+'</div>');
  })
  $('.status-wrap').fadeIn('slow').delay(5000).fadeOut('slow');
}

//console.log(authors);
