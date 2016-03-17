"use strict";
var nrOfQns = $('.qn').length;
var userID = data.userid;

$(document).ready(function() {
  // Load the final recommended set of movies
  // Load the new recommendation set
  // for(var i in data.movies) {
  //   var mID = data.movies[i];
  //   loadMovieInfo(i, mID, 'id');
  // }

	$('#finish').click(function() {
		if(isSurveyComplete()) 
			finish();
		else 
			alert("Oops! Looks like the some questions haven't been answered yet.");
	});

	// Make sure client wants leave
  $(window).on('beforeunload', function() {
    if(confirmUnload)
      return 'We would really appreciate it if you could complete this survey for our course project.'
            + ' You can also come back to complete it later on from where you left.';
  });
});

/**
 * Load the movie info on screen
 */
// function loadMovieInfo(itemNr, mID, mType) {
//   getMovieInfo(mID, mType, function(movieInfo) {
//     itemNr++;

//     // Load the correct poster URL
//     var pictureURL;
//     if(movieInfo.imdbPictureURL.length > 0)
//       pictureURL = movieInfo.imdbPictureURL;
//     else if (movieInfo.rtPictureURL.length > 0) 
//       pictureURL = movieInfo.rtPictureURL;
//     else
//       pictureURL = 'http://marvelmoviemarathon.com/posters/placeholder.png';

//     $('.movieslist li:nth-child(' + itemNr + ') .cover').css('background-image', 'url(' + pictureURL + ')');
//     $('.movieslist li:nth-child(' + itemNr + ') .movietitle').text(movieInfo.title);
//     $('.movieslist li:nth-child(' + itemNr + ') .movieyear').text(movieInfo.year);
//   });
// }

// /**
//  * Retrieve movie info from database
//  */
// function getMovieInfo(mID, mType, cb) {
//   // Choose the correct key type
//   switch (mType) {
//     case 'imdb': 
//       mType = 'imdbID';
//       break;
//     case 'movieid': 
//       mType = 'movieID';
//       break;
//     default:
//       mType = '_id';
//   }

//   $.ajax({
//     type: 'GET',
//     url: serverUrl + '/api/movies',
//     data: {
//       id: mID,
//       type: mType
//     },
//     dataType: 'json',
//     success: function(data) {
//       cb(data[0]);
//     },
//     error: function(err) {
//       console.log(err.responseText);
//     }
//   });
// }

/**
 * Save survey answers online and finish.
 */
function finish() {
	var answers = [];
	for(var i=1; i<=nrOfQns; i++) {
		answers.push($('input[name=qn'+i+']:checked').val());
	}

	$.ajax({
    type: 'POST',
    url: serverUrl + '/api/update/answers',
    data: {
      userID: userID,
      answers: answers
    },
    success: function() {
      confirmUnload = false;
    	location.reload();
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}

/**
 * Check if all questions have been answered.
 */
function isSurveyComplete() {
	for(var i=1; i<=nrOfQns; i++) {
		if (!$('input[name=qn'+i+']:checked').length) {
			return false;
		}
	}
	return true;
}