"use strict";
var nrOfMovies = $('.movieslist li').length;
var learnRate = 0.7;
var discardRate = 0.2;
var maxChoices = 10;
var userID = data.userid;
var choiceNumber = data.choiceNumber;
var movies = data.movies || [];

$.fn.exists = function() {
  return this.length !== 0;
};

$(document).ready(function() {
  // Update the remaining number of choices to make
  refreshChoicesCount();

  // Check if existing session info exists
  if (choiceNumber === 0) {
    // Load random set of movies
    loadRandomMovies();
  } else {
    // Load movies from last session
    for (var i in movies) {
      var mID = movies[i];
      loadMovieInfo(i, mID, 'id');
    }
  }

  // Look for trailer when hovering over movie
  $('.movieslist li .cover').click(function() {
    // Find which movie was clicked
    var moviePos = $(this).parent().index();
    loadTrailer(moviePos);
  });

  $('.movieslist li .select').click(function() {
    // Find which movie was clicked
    var moviePos = $(this).parent().index();
    // Update choice number && Get new recommendations
    postChoiceNumber(movies[moviePos]._id, getChoiceSet);
  });

  // Make sure client wants leave
  $(window).on('beforeunload', function() {
    return 'We would really appreciate it if you could complete this survey for our course project. It means a lot to us. Thank you.';
  });
});

/**
 * Update choice number
 */
function postChoiceNumber(mID, cb) {
  $.ajax({
    type: 'POST',
    url: serverUrl + '/api/update/choicenumber',
    data: {
      userID: userID
    },
    dataType: 'json',
    success: function(result) {
      choiceNumber = result;
      refreshChoicesCount();
      cb(mID);
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}

/**
 * Get new recommendation set
 */
function getChoiceSet(mID) {
  $.ajax({
    type: 'POST',
    url: 'http://131.155.121.165:8080/json/asynconeway/Choice',
    data: {
      userid: '' + userID,
      movieid: mID,
      learn_rate: learnRate,
      choice_number: choiceNumber,
      discard_rate: discardRate,
      number_of_candidates: choiceNumber === maxChoices ? 5 : nrOfMovies
    },
    dataType: 'json',
    success: function(data) {
      // Load the new recommendation set
      for (var i in data) {
        var movie = data[i];
        loadMovieInfo(i, movie.itemid, 'movieid');
      }

      // Update the movies list on the backend for the user
      postMovies();

      // Reload the page after maximum number of choices have been made
      if(choiceNumber >= maxChoices) location.reload();
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}

/**
 * Load random movies
 */
function loadRandomMovies() {
  getMoviesCount(function(count) {
    for (var i = 0; i < nrOfMovies; i++) {
      var mID = 1 + Math.floor(Math.random() * count);
      loadMovieInfo(i, mID, 'id');
    }
  });
}

/**
 * Load the movie info on screen
 */
function loadMovieInfo(itemNr, mID, mType) {
  getMovieInfo(mID, mType, function(movieInfo) {
    movies[itemNr] = movieInfo;
    itemNr++;
    $('.movieslist li:nth-child(' + itemNr + ') .cover').css(
      'background-image', 'url(' + movieInfo.imdbPictureURL + ')');
    $('.movieslist li:nth-child(' + itemNr + ') .movietitle').text(
      movieInfo.title);
    $('.movieslist li:nth-child(' + itemNr + ') .movieyear').text(
      movieInfo.year);
  });
}

/**
 * Retrieve movie info from database
 */
function getMovieInfo(mID, mType, cb) {
  // Choose the correct key type
  switch (mType) {
    case 'imdb': 
      mType = 'imdbID';
      break;
    case 'movieid': 
      mType = 'movieID';
      break;
    default:
      mType = '_id';
  }

  $.ajax({
    type: 'GET',
    url: serverUrl + '/api/movies',
    data: {
      id: mID,
      type: mType
    },
    dataType: 'json',
    success: function(data) {
      cb(data[0]);
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}

/**
 * Get trailer for a movie and load on screen
 */
function loadTrailer(pos) {
  if (movies[pos].trailerKey) {
    embedTrailer(movies[pos].trailerKey);
  } else {
    getTrailer(movies[pos]._id, function(trailerKey) {
      movies[pos].trailerKey = trailerKey;
      embedTrailer(trailerKey);
    });
  }
}

/**
 * Embed the trailer on screen
 */
function embedTrailer(key) {
  // Create and place the embed code on the page
  var embed = '<iframe src="https://www.youtube.com/embed/' + key +
    '" frameborder="0" allowfullscreen class="video"></iframe>';
  $('.trailer-container').html(embed);
}

/**
 * Retreive trailer video data
 */
function getTrailer(mID, cb) {
  $.ajax({
    type: 'GET',
    url: serverUrl + '/api/trailer',
    data: {
      id: mID
    },
    dataType: 'text',
    success: function(data) {
      cb(data);
    },
    error: function(err) {
      $('.trailer-container').html(err.responseText);
    }
  });
}

/**
 * Get the total number of movies in our database
 */
function getMoviesCount(cb) {
  $.ajax({
    type: 'GET',
    url: serverUrl + '/api/count',
    dataType: 'json',
    success: function(data) {
      cb(data.count);
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}

/**
 * Update the movies that are on-screen to the backend
 * to reload the same movies next time
 */
function postMovies() {
  var movieIds = movies.map(function(movie) {
    return movie._id;
  });
  $.ajax({
    type: 'POST',
    url: serverUrl + '/api/update/movies',
    data: {
      userID: userID,
      movies: movieIds
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}

/**
 * Update the remaining number of choices to
 * be made on-screen.
 */
function refreshChoicesCount() {
  $('#remNrOfChoices strong').html(maxChoices-choiceNumber);
}
