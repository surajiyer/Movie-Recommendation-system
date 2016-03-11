var nr_of_movies = $('.movieslist li').length;
var movieIds = [];
var serverUrl = 'http://localhost:3000';

$.fn.exists = function () {
    return this.length !== 0;
}

$(document).ready(function() {
	// Load random set of movies
	loadRandomMovies();

	// Look for trailer when hovering over movie
	$('.movieslist li .poster').click(function() {
		// Find which movie was clicked
		var moviePos = $(this).parent().index();

		// If a trailer key exists
		if(movieIds[moviePos].trailerKey) {
			loadTrailer(movieIds[moviePos].trailerKey);
		} else {
			(function(pos) {
				getTrailer(movieIds[pos].id, function(trailerKey) {
					movieIds[pos].trailerKey = trailerKey;
					loadTrailer(trailerKey);
				});
			})(moviePos);
		}
	});
});

function loadRandomMovies() {
	getMoviesCount(function(count) {
		for (i = 0; i < nr_of_movies; i++) {
			var mID = 1 + Math.floor(Math.random() * count);
			movieIds[i] = {
				'id': mID
			};
			(function(itemNr) {
				getMovieInfo(mID, count, function(movieInfo) {
					movieIds[itemNr].title = movieInfo.title;
					itemNr++;
					$(".movieslist li:nth-child("+itemNr+") .movietitle").text(movieInfo.title);
	    		$(".movieslist li:nth-child("+itemNr+") .poster img").attr("src", movieInfo.rtPictureURL);
				});
			})(i);
		}
	});
}

function getMoviesCount(cb) {
	$.ajax({
		type: 'GET',
		url: serverUrl+'/api/movies-count',
		dataType: 'json',
		success: function(data) {
			cb(data.count);
		},
		error: function(err) {
			console.log(err);
		}
	});
}

function getMovieInfo(mID, count, cb) {
	$.ajax({
		type: 'GET',
		url: serverUrl+'/api/movies',
		data: {
			id : mID
		},
		dataType: 'json',
		success: function(data) {
			cb(data[0]);
		},
		error: function(err) {
			console.log(err);
		}
	});
}

function loadTrailer(key) {
	// Create and place the embed code on the page
	var embed = '<iframe width="640" height="360" src="https://www.youtube.com/embed/'+key+'" frameborder="0" allowfullscreen></iframe>'
	$('.trailer-container').html(embed);
}

function getTrailer(movieID, cb) {
	$.ajax({
		type: 'GET',
		url: serverUrl+'/api/trailer',
		data: {
			'id': movieID
		},
		dataType: 'text',
		success: function(data) {
			cb(data);
		},
		error: function(err) {
			console.log(err);
		}
	});
}

function getTrailerAddict(movieName, cb) {
	// Format the movie name for calling API correctly
	console.log(movieName);
	movieName = movieName.replace(/ /g, "-");
	console.log(movieName);

	// Call the TrailerAddict API
	$.ajax({
		type: 'GET',
		url: 'http://api.traileraddict.com/',
		data: {
			'film': movieName,
			'count': 1,
			'width': 640
		},
		crossDomain: true,
		dataType: 'xml',
		success: function(data) {
			data = $.parseXML(data);
			data = $(data);
			var embed = data.find('embed');
			if(embed.exists())
				cb(embed);
			else
				cb('<p>Unfortunately, we could not find any trailer for this movieslist.</p>');
		},
		error: function(err) {
			console.log(err);
		}
	});
}