"use strict";
var express = require('express');
var router = express.Router();
var request = require('request');
var utils = require('./utils.js');

/* GET movies by movie any id. */
router.get('/movies', function(req, res) {
	if (!(req.query.id && req.query.type)) return utils.sendErr(res, 'Missing parameter(s)');
  var db = req.db;
  var collection = db.get('movies');

  // Find movie in database
  var query = {};
  var id = Number(req.query.id);
  var type = req.query.type;
  query[type] = id;
  collection.find(query, {}, function(err, docs) {
    if (err) return utils.sendErr(res, 'Could not get movie info.');
    res.json(docs);
  });
});

/* GET number of movies in database. */
router.get('/count', function(req, res, next) {
  var db = req.db;
  var collection = db.get('movies');

  collection.count({}, function(err, count) {
    if (err) return next(err);
    res.send({'count': count});
  });
});

/* GET trailer video key. */
router.get('/trailer', function(req, res, next) {
  // Get the movie id from the request
  if (!req.query.id) return utils.sendErr(res, 'Missing parameter(s)');
  var id = Number(req.query.id);
  var db = req.db;
  var collection = db.get('movies');

  // Find movie in database
  collection.find({_id: id}, {}, function(err, docs) {
    if (err) return utils.sendErr(res, 'Failed to find movie.');
    getID(docs[0].imdbID, getTrailer, res, next);
  });
});

/* POST update movies on page of user. */
router.post('/update/movies', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userID && req.body.movies)) return utils.sendErr(res, 'Missing parameter(s)');
  var userID = utils.pad(req.body.userID, 12);
  var movies = req.body.movies;
  var db = req.db;
  var users = db.get('users');

  // Update movies in user session data
  users.updateById(userID, {$set:{movies: movies}}, function(err) {
  	if (err) return next(err);
  	res.send('Ok');
  });
});

/* POST update movies chosen movies by user. */
router.post('/update/choices', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userID && req.body.movie)) return utils.sendErr(res, 'Missing parameter(s)');
  var userID = utils.pad(req.body.userID, 12);
  var movie = req.body.movie;
  var db = req.db;
  var users = db.get('users');

  // Update selected movie in user session data
  users.updateById(userID, {$push:{choices: movie}}, function(err) {
  	if (err) return next(err);
  	res.send('Ok');
  });
});

/* POST update movies on page of user. */
router.post('/update/choicenumber', function(req, res, next) {
  // Get the user id from the request
  if (!req.body.userID) return utils.sendErr(res, 'Missing parameter(s)');
  var userID = utils.pad(req.body.userID, 12);
  var db = req.db;
  var users = db.get('users');

  // Update choice number in user session data
  users.updateById(userID, {$inc: {choiceNumber: 1}}, {new: true}, 
  	function(err, result) {
	    if (err) return utils.sendErr(res, 'Failed to update movies list.');
	    res.json(result);
	  });
});

/* POST update survey answers. */
router.post('/update/answers', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userID && req.body.answers)) return utils.sendErr(res, 'Missing parameter(s)');
  var userID = utils.pad(req.body.userID, 12);
  var answers = req.body.answers;
  var db = req.db;
  var users = db.get('users');

  // Update survey answers in user session data
  users.updateById(userID, {$set:{answers: answers}}, function(err) {
  	if (err) return utils.sendErr(res, 'Failed to update survey answers.');
  	res.send('Ok');
  });
});

/**
 * Get TheMovieDB movie id using ImDB id.
 */
function getID(imdbID, cb, res, next) {
  imdbID = "tt" + utils.pad(imdbID, 7);
  request({
    uri: "https://api.themoviedb.org/3/find/" + imdbID,
    qs: {
      api_key: process.env.THEMOVIEDB_API_KEY,
      external_source: 'imdb_id'
    },
    json: true
  }, function(err, response, data) {
    if (err || response.statusCode != 200) return utils.sendErr(res, "Could not find trailer. Code '1'.");
    var id = data.movie_results[0].id;
    cb(id, res, next);
  });
}

/**
 * Get trailer video key from TheMovieDB API.
 */
function getTrailer(id, res) {
  request({
    uri: "https://api.themoviedb.org/3/movie/" + id + "/videos",
    qs: {
      api_key: process.env.THEMOVIEDB_API_KEY
    },
    json: true
  }, function(err, response, data) {
    if (err || response.statusCode != 200) return utils.sendErr(res, "Could not find trailer. Code '2'.");
    var videos = data.results;
    for (var i in videos) {
      var video = videos[i];
      if (video.type == "Trailer" && video.key) {
        res.send(video.key);
        return;
      }
    }
    utils.sendErr(res, "Could not find trailer. Code '3'.");
  });
}

module.exports = router;