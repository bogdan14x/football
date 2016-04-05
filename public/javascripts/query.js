$(document).ready(function() {

  $("#twitterForm").submit(function(event) {

    var query = $('#query').val();

    var dbOnly = $('#dbOnly').is(":checked");

    event.preventDefault();

    const url = 'http://localhost:3000';

    var author = /@(\w+)(?!\w)/g, authors = [];
    var mention = /mention:@(\w+)(?!\w)/g, mentions = [];
    var tag = /#(\w+)(?!\w)/g, tags = [];
    var keyword = /'(\w+)'(?!\w)/g, keywords = [];

    while (match = author.exec(query)) {
      authors.push(match[1]);
    }
    while (match = mention.exec(query)) {
      mentions.push(match[1]);
    }
    while (match = tag.exec(query)) {
      tags.push(match[1]);
    }
    while (match = keyword.exec(query)) {
      keywords.push(match[1]);
    }

    var params = {keywords: keywords, screen_name: authors[0], tags: tags, mentions: mentions, dbOnly: dbOnly};

    $.ajax({
			type: 'POST',
			data: JSON.stringify(params),
      contentType: 'application/json',
      url: 'http://localhost:3000/',
      success: function(data) {
        console.log('success');
        $('.status').append(data[1]);
        data[0].map((tweet) => {
          $('#result').append('<p>'+tweet.text+'</p>');
        });
      }
    });
  });
});
