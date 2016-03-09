var nr_of_movies = 10;

$.fn.exists = function () {
    return this.length !== 0;
}

$(document).ready(function() {
	getMoviesCount(function(count) {
		for (i = 1; i <= nr_of_movies; i++) {
			var mID = 1 + Math.floor(Math.random() * count);
			(function(itemNr) {
				getMovieInfo(mID, count, function(movieInfo) {
					$(".movieslist li:nth-child("+itemNr+") .movietitle").text(movieInfo.title);
	    		$(".movieslist li:nth-child("+itemNr+") .poster img").attr("src", movieInfo.rtPictureURL);
				});
			})(i);
		}
	});
});

function getMoviesCount(cb) {
	$.ajax({
		type: 'GET',
		url: "http://localhost:3000/api/movies-count",
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
		url: "http://localhost:3000/api/movies",
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

function getTrailer(movieName, cb) {
	// Format the movie name for calling API correctly
	movieName = movieName.replace(/ /g, "_");
	console.log(movieName);

	// Call the TrailerAddict API
	$.ajax({
		type: 'GET',
		url: "http://api.traileraddict.com/",
		data: {
			'film': movieName,
			'count': 1,
			'width': 640
		},
		dataType: 'xml',
		success: function(data) {
			data = $.parseXML(data);
			data = $(data);
			var embed = data.find('embed');
			if(embed.exists())
				cb(embed);
			else
				console.log('Error: Could not find trailer');
		},
		error: function(err) {
			console.log(err);
		}
	});
}