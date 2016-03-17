"use strict";
var nrOfMovies = $('.movieslist li').length;
var learnRate = 0.7;
var discardRate = 0.2;
var maxChoices = 10;
var userID = data.userid;
var choiceNumber = data.choiceNumber;
var movies = data.movies || [];
var timer, delay = 1000;

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
    for(var i in movies) {
      var mID = movies[i];
      loadMovieInfo(i, mID, 'id');
    }
  }

  // Look for trailer when hovering over movie
  $('.movieslist li .cover').hover(function() {
    // on mouse in, start a timeout
    var that = this;
    timer = setTimeout(function() {
      // Find which movie was clicked
      var moviePos = $(that).parent().index();
      loadMovieDescription(moviePos);
      loadTrailer(moviePos);
    }, delay);
  }, function() {
    // on mouse out, cancel the timer
    clearTimeout(timer);
  });

  $('.movieslist li .select').click(function() {
    // Find which movie was clicked
    var moviePos = $(this).parent().index();
    // Update choice number && Get new recommendations
    getChoiceSet(movies[moviePos]._id, postChoiceNumber);
  });

  // Make sure client wants leave
  $(window).on('beforeunload', function() {
    if(confirmUnload)
      return 'We would really appreciate it if you could complete this survey for our course project.'
            + ' You can also come back to complete it later on from where you left.'; 
  });
});

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
  return getMovieInfo(mID, mType, function(movieInfo) {
    movies[itemNr] = movieInfo;
    itemNr++;

    // Load the correct poster URL
    var pictureURL;
    if(movieInfo.imdbPictureURL.length > 0)
      pictureURL = movieInfo.imdbPictureURL;
    else if (movieInfo.rtPictureURL.length > 0) 
      pictureURL = movieInfo.rtPictureURL;
    else
      pictureURL = 'http://marvelmoviemarathon.com/posters/placeholder.png';

    $('.movieslist li:nth-child(' + itemNr + ') .cover').css('background-image', 'url(' + pictureURL + ')');
    $('.movieslist li:nth-child(' + itemNr + ') .movietitle').text(movieInfo.title);
    $('.movieslist li:nth-child(' + itemNr + ') .movieyear').text(movieInfo.year);
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

  return $.ajax({
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
  if(movies[pos]) {
    if (movies[pos].trailerKey) {
      embedTrailer(movies[pos].trailerKey);
    } else {
      getTrailer(movies[pos]._id, function(trailerKey) {
        movies[pos].trailerKey = trailerKey;
        embedTrailer(trailerKey);
      });
    }
  }
}

/**
 * Embed the trailer on screen
 */
function embedTrailer(key) {
  // Create and place the embed code on the page
  var embed = '<iframe src="https://www.youtube.com/embed/' + key +
    '" frameborder="0" allowfullscreen class="video"></iframe>';
  $('.trailer').html(embed);
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
      $('.trailer').html(err.responseText);
    }
  });
}

function loadMovieDescription(pos) {
  $('#moviesummary').text(movies[pos].summary);
  $('#moviegenres').text(movies[pos].Genres);
  $('#moviedirector').text(movies[pos].director);
  $('#moviecast').text(movies[pos].cast);
}

/**
 * Get new recommendation set
 */
function getChoiceSet(mID, cb) {
  $.ajax({
    type: 'POST',
    url: 'http://131.155.121.165:8080/json/asynconeway/Choice',
    data: {
      "userid": "" + userID,
      "movieid": "" + mID,
      "learn_rate": "" + learnRate,
      "choice_number": "" + choiceNumber,
      "discard_rate": "" + discardRate,
      "number_of_candidates": "" + nrOfMovies
      //"number_of_candidates": "" + (choiceNumber === maxChoices ? 5 : nrOfMovies)
    },
    dataType: 'json',
    success: function(data) {
      // First, reset movies list on-screen
      resetMovies();

      // Filter the new recommendation set
      data = data.map(function(movie) {
        if(movie.itemid > 0) return movie.itemid;
      });

      // Load the new recommendation set
      var promises = [];
      for(var i in data) {
        var mID = data[i];
        console.log(i+' '+mID);
        promises.push(loadMovieInfo(i, mID, 'movieid'));
      }

      // Save the movie selected
      postChoices(mID);

      // When movie info is loaded for all movies
      $.when.apply($, promises).done(function() {
        // Update the movies list on the backend for the user
        postMovies();
      });

      // Execute callback if any
      if (typeof cb != 'undefined') cb();
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}

/**
 * Update choice number.
 */
function postChoiceNumber() {
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
      // Reload the page after maximum number of choices have been made
      if(choiceNumber >= maxChoices) {
        confirmUnload = false;
        location.reload();
      }
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

/**
 * Reset movies info in movies list.
 */
function resetMovies() {
  movies = [];
  for(var i=1; i<=nrOfMovies; i++) {
    var pictureURL = 'http://marvelmoviemarathon.com/posters/placeholder.png';
    $('.movieslist li:nth-child(' + i + ') .cover').css('background-image', 'url(' + pictureURL + ')');
    $('.movieslist li:nth-child(' + i + ') .movietitle').text('{title}');
    $('.movieslist li:nth-child(' + i + ') .movieyear').text('{year}');
  }
}

/**
 * Update the selected movie choice.
 */
function postChoices(mID) {
  // FIXME
  console.log(movies);
  var movieIds = movies.map(function(movie) {
    return movie._id;
  });
  // FIXME
  console.log(movieIds);
  $.ajax({
    type: 'POST',
    url: serverUrl + '/api/update/choices',
    data: {
      userID: userID,
      movie: mID
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}

/**
 * Update the movies that are on-screen to the backend
 * to reload the same movies next time.
 */
function postMovies() {
  // FIXME
  console.log(movies);
  var movieIds = movies.map(function(movie) {
    return movie._id;
  });
  console.log(movieIds);
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
