
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
  var str_or = (query.match(/OR/g) || []).length;
  var str_and = (query.match(/AND/g) || []).length;
  var result = -2;

  if(str_or > 0 && str_and <= 0)
    result = 0;
  if(str_and > 0 && str_or <= 0)
    result = 1;
  if(str_and > 0 && str_or > 0)
    result = -1;
  if(str_and <= 0 && str_or <= 0)
    result = 0;

  var query_elements = keywords.length + authors.length + mentions.length + hashtags.length;
  if(str_or == 0 && str_and != query_elements - 1)
    result = -1;
  if(str_and == 0 && str_or != query_elements - 1)
    result = -1;

  return {keywords: keywords, authors: authors, hashtags: hashtags, mentions: mentions, dbOnly: dbOnly, query: result};
}


function renderLocations(data) {
  if(data)
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

function renderTeam(data) {

  $('.research-title').html('<strong>'+data.clubname+'</strong>');
  $('.research-title').css('display', 'block');
  $('.main-title-research').html('Details');
  $('.search-wrap').css('display', 'none');
  $('.buttonRow').css('display', 'block');
  $('.research-hr').css('display', 'block');
  $('.modal-desc').html(data.abstract);
  $('.modal-stadium').html(data.stadium_desc.value);
  $('.modal-stadium').append('<div class="stadium-img"></div>');
  $('.stadium-img').css('background-image', 'url('+data.stadium_thumb.value+')');

  //console.log(data.manthumb);

  $('.modal-players').append('<div class="col-sm-6">' +
    '<div class="media-left media-middle">'+
      `<div class="player-img" style="background-image: url('${data.manthumb}')"></div>`+
    '</div>'+
    '<div class="media-body">'+
      '<p style="font-family: GothamLight;">'+data.manager+'</p>'+
      '<p style="font-family: Book;">Manager</p>'+
    '</div>'+
  '</div>');

  data.players.map(function(item) {
    var name = '<p style="font-family: GothamLight;">'+item.name+'</p>';
    var position = '<p style="font-family: Book;">'+item.position+'</p>';
    var bd = '<p style="font-family: GothamMedium;">'+item.birthdate+'</p>';
    var picture = `<div class="player-img" style="background-image: url('${item.picture}')"></div>`;
    var player = `<div class="col-sm-6" style="display: flex;"><div>${name}${position}${bd}</div>${picture}</div>`;
    var entry = '<div class="col-sm-6">' +
      '<div class="media-left media-middle">'+
        picture +
      '</div>'+
      '<div class="media-body">'+
        name+position+bd+
      '</div>'+
    '</div>';
    $('.modal-players').append(entry);
  })
}

//console.log(authors);
