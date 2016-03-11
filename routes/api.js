var express = require('express');
var router = express.Router();
var env = require('../env.js');
var request = require('request');

/* GET movies by movie _id or imdbID. */
router.get('/movies', function(req, res, next) {
	var db = req.db;
  var collection = db.get('movies');

  if(req.query.id) {
	  var id = Number(req.query.id);
	  collection.find({'_id': id}, {}, function(err, docs) {
	  	if (err) return next(err);
	  	res.json(docs);
	  });
	} else if(req.query.imdbID) {
		var id = Number(req.query.imdbID);
	  collection.find({'imdbID': id}, {}, function(err, docs) {
	  	if (err) return next(err);
	  	res.json(docs);
	  });
	}
});

/* GET number of movies in database. */
router.get('/movies-count', function(req, res, next) {
	var db = req.db;
  var collection = db.get('movies');
  collection.count({}, function (err, count) {
  	if (err) return next(err);
  	res.send({'count': count});
	});
});

/* GET trailer video key. */
router.get('/trailer', function(req, res, next) {
  if(!req.query.id) return next(new Error('Please pass a movie id.'));
  var db = req.db;
  var collection = db.get('movies');

  // Get Movie from database
	var id = Number(req.query.id);
  collection.find({'_id': id}, {}, function(err, docs) {
  	if (err) return next(err);
  	getID(docs[0].imdbID, getTrailer, res, next);
  });
});

function getID(imdbID, cb, res, next) {
	var imdbID = "tt"+pad(imdbID, 7);
	request({
		uri: "https://api.themoviedb.org/3/find/"+imdbID,
		qs: {
			'api_key': process.env.THEMOVIEDB_API_KEY,
			'external_source': 'imdb_id'
		},
		json: true
	}, function(err, response, data) {
		if(err || response.statusCode != 200) return next(err);
		var id = data.movie_results[0].id;
		cb(id, res, next);
	});
}

function getTrailer(id, res, next) {
	request({
		uri: "https://api.themoviedb.org/3/movie/"+id+"/videos",
		qs: {
			'api_key': process.env.THEMOVIEDB_API_KEY
		},
		json: true
	}, function(err, response, data) {
		if(err || response.statusCode != 200) return next(err);
		console.log(data);
		var videos = data.results
		for (var i in videos) {
			var video = videos[i];
			if(video.type == "Trailer" && video.key) {
				res.send(video.key);
				return;
			}
		}
		return next(new Error('Could not find a trailer'));
	});
}

function pad (str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

module.exports = router;
