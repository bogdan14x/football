$(document).ready(function() {
  var socket = io();
  $("#retrieveButton").click(function() {

    var params = {keyword: $("#keyword").val(), screen_name: $("#screen_name").val()};
    console.log('Retrieving tweets by '+params.screen_name);
    socket.emit('get_tweets', params);
    var header = function() {
      if(params.screen_name && params.keyword)
        return '<h2>Tweets by <span class="blue">@'+params.screen_name+'</span> containing <span class="blue">'+params.keyword+'</h2>';
      if(!params.screen_name)
        return '<h2>Tweets containing <span class="blue">'+params.keyword+'</span></h2>';
      if(!params.keyword)
        return '<h2>Tweets by <span class="blue">@'+params.screen_name+'</span></h2>';
    }
    $('#result').append(header);
  });

  socket.on('tweet', function(data) {
    var item = '<div>' + data.text + '</div>';
    $('#result').append(item);
  });
});
