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
    res.json({'success': true, 'result': docs});
  });
});

/* GET number of movies in database. */
router.get('/count', function(req, res, next) {
  var db = req.db;
  var collection = db.get('movies');

  collection.count({}, function(err, count) {
    if (err) return next(err);
    res.json({'success': true, 'result': count});
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
  collection.findById(id, function(err, docs) {
    if (err) return utils.sendErr(res, 'Failed to find movie.');
    getID(docs.imdbID, getTrailer, res, next);
  });
});

/* POST events generated on page. */
router.post('/update/event', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userid && req.body.event && typeof req.body.eventdesc != 'undefined')) 
    return utils.sendErr(res, 'Missing parameter(s)');
  var userid = utils.pad(req.body.userid, 12);
  var event = req.body.event;
  var eventdesc = req.body.eventdesc;
  utils.updateEvent(req.db, event, eventdesc, userid, res);
  res.json({'success': true});
});

/* POST update movies on page of user. */
router.post('/update/choicenumber', function(req, res, next) {
  // Get the user id from the request
  if (!req.body.userid) return utils.sendErr(res, 'Missing parameter(s)');
  var userid = utils.pad(req.body.userid, 12);
  var db = req.db;
  var users = db.get('users');

  // Update choice number in user session data
  users.findAndModify({_id: userid}, {$inc: {choice_number: 1}}, {new: true}, function(err, docs) {
    if (err) return utils.sendErr(res, 'Failed to update choice number.');
    res.json({'success': true, 'result': docs.choice_number});
  });
});

/* POST update movies choice set. */
router.post('/update/movies', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userid && req.body.movies)) return utils.sendErr(res, 'Missing parameter(s)');
  var userid = utils.pad(req.body.userid, 12);
  var movies = JSON.parse(req.body.movies);
  var db = req.db;
  var users = db.get('users');

  // Update movies in user session data
  users.updateById(userid, {$push:{choice_set: movies}}, function(err) {
  	if (err) return next(err);
  	res.json({'success': true});
  });
});

/* POST update watched trailers. */
router.post('/update/watchedtrailers', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userid && req.body.movie)) return utils.sendErr(res, 'Missing parameter(s)');
  var userid = utils.pad(req.body.userid, 12);
  var movie = req.body.movie;
  var db = req.db;  
  var users = db.get('users');

  // Update movie id whose trailer was watched
  users.updateById(userid, {$addToSet:{watched_trailers: movie}}, function(err) {
    if (err) return utils.sendErr(res, 'Failed to update watched trailer.');
    res.json({'success': true});
  });
});

/* POST update to use trailers or not. */
router.post('/update/usetrailers', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userid && req.body.useTrailers)) return utils.sendErr(res, 'Missing parameter(s)');
  var userid = utils.pad(req.body.userid, 12);
  var useTrailers = (req.body.useTrailers == "true");
  var db = req.db;
  var users = db.get('users');

  // Update movie id whose trailer was watched
  users.updateById(userid, {$set:{use_trailers: useTrailers}}, function(err) {
    if (err) return utils.sendErr(res, 'Failed to update trailer usage.');
    res.json({'success': true});
  });
});

/* POST update movies hovered/clicked on. */
router.post('/update/hoveredmovies', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userid && req.body.movie)) return utils.sendErr(res, 'Missing parameter(s)');
  var userid = utils.pad(req.body.userid, 12);
  var movie = req.body.movie;
  var db = req.db;  
  var users = db.get('users');

  // Update movie id whose info was loaded
  users.updateById(userid, {$addToSet:{hovered_movies: movie}}, function(err) {
    if (err) return utils.sendErr(res, 'Failed to update hovered movies.');
    res.json({'success': true});
  });
});

/* POST update movies chosen by user. */
router.post('/update/choices', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userid && req.body.movie)) return utils.sendErr(res, 'Missing parameter(s)');
  var userid = utils.pad(req.body.userid, 12);
  var movie = req.body.movie;
  var db = req.db;
  var users = db.get('users');

  // Update selected movie in user session data
  users.updateById(userid, {$push:{choices: movie}}, function(err) {
  	if (err) return next(err);
  	res.json({'success': true});
  });
});

/* POST update survey answers. */
router.post('/update/answers', function(req, res, next) {
  // Get the user id from the request
  if (!(req.body.userid && req.body.answers)) return utils.sendErr(res, 'Missing parameter(s)');
  var userid = utils.pad(req.body.userid, 12);
  var answers = JSON.parse(req.body.answers);
  var db = req.db;
  var users = db.get('users');

  // Update survey answers in user session data
  users.updateById(userid, {$set:{answers: answers}}, function(err) {
  	if (err) return utils.sendErr(res, 'Failed to update survey answers.');
  	res.json({'success': true});
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
    if (err || response.statusCode != 200) return utils.sendErr(res, 'Could not find trailer. Code "1".');
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
    if (err || response.statusCode != 200) return utils.sendErr(res, 'Could not find trailer. Code "2".');
    var videos = data.results;
    for (var i in videos) {
      var video = videos[i];
      if (video.type == "Trailer" && video.key) {
        return res.json({'success': true, 'result': video.key});
      }
    }
    utils.sendErr(res, 'Could not find trailer. Code "3".');
  });
}

module.exports = router;