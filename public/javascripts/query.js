$(document).ready(function() {

  $("#twitterForm").submit(function(event) {

    var query = $('#query').val();
    var dbOnly = $('input[name=dbOnly]').is(':checked');
    console.log('database only: '+dbOnly);

    event.preventDefault();

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

    //console.log(mentions);

    function renderTweets(data) {
      if(data) {
        $('#result').empty();
        $('#tweets .main-wrap').addClass('overflow-fix');
        data.map((tweet) => {
          var result = '<div class="tweet"><img src='+tweet.author.profile_image_url+'/><span class="name">'+tweet.author.name+':</span><span class="text">'+tweet.text+'</span></div>';
          $('#result').append(result);
        });
      } else {
        $('#result').empty();
        $('#result').append('No tweets found.');
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
          var stat = '<div class="col-xs-12" style="font-size:1.4em;"><span>'+words[i]+'</span><span style="float: right;">'+vals[i]+'</span></div>';
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
      data.map((msg) => {
        $('.status').append('<div>'+msg+'</div>');
      })
      $('.status-wrap').fadeIn('slow').delay(5000).fadeOut('slow');
    }

    //console.log(authors);
    var params = {keywords: keywords, authors: authors, hashtags: hashtags, mentions: mentions, dbOnly: dbOnly};
    $("#overlay").addClass("dimmed");
    $(".fa-li").toggle();
    $.ajax({
			type: 'POST',
			data: JSON.stringify(params),
      contentType: 'application/json',
      url: 'http://social-trackr-fit.herokuapp.com/',
      success: function(data) {
        console.log('success');
        //console.log(data);
        $('#query').val("");
        renderStatus(data[1]);

        if(params.dbOnly) {
          renderTweets(data[0]);
          renderWords(data[2]);
          renderUsers(data[3]);
        }
        //console.log(data);
      },
      complete: function(){
        $("#overlay").removeClass("dimmed");
        $(".fa-li").toggle();
      }
    });
  });
});
