"use strict";
var express = require('express');
var router = express.Router();
var utils = require('./utils.js');
var title = ' | MRS';

/* GET error if no user id specified in URL. */
router.get('/', function(req, res, next) {
  next(new Error("Please type in some unique user ID at the end of the URL after the '/'"));
});

/* GET Favicon interceptor */
router.get('/favicon.ico', function (req, res) {
  res.end();
});

/* GET home page. */
router.get('/:id', function(req, res, next) {
  // Get the user id from the request
  var userid = utils.pad(req.params.id, 12);

  // Check if user id exists
  var db = req.db;
  var users = db.get('users');
  users.findById(userid, function(err, doc) {
    // If user not found,
    if (doc === null) {
      return users.insert({
        _id: userid,
        choice_number: -1,
        choice_set: [],
        watched_trailers: [],
        hovered_movies: [],
        choices: [],
        answers: null 
      }, function(err) {
        if (err) return next(err);
        res.render('intro', {
          title: 'Introduction' + title,
          data: {
            userid: userid
          }
        }, function(err, html) {
          res.send(html);
          utils.updateEvent(db, 'Loaded Introduction page', null, userid, res);
        });
      });
    }

    // If user is found,
    switch(doc.choice_number) {
      case -1:
        // Introduction page
        res.render('intro', {
          title: 'Introduction' + title,
          data: {
            userid: userid
          }
        }, function(err, html) {
          res.send(html);
          utils.updateEvent(db, 'Loaded Introduction page', null, userid, res);
        });
        break;

      case 10:
        var finish = typeof doc.answers != 'undefined' && doc.answers !== null;
        if(finish) {
          // Finish page
          res.render('finish', { 
            title: 'Finished' + title,
            data: { userid: userid }
          }, function(err, html) {
            res.send(html);
            utils.updateEvent(db, 'Loaded Finish page', null, userid, res);
          });
        } else {
          // Survey page
          res.render('survey', {
            title: 'Final survey' + title,
            data: { userid: userid }
          }, function(err, html) {
            res.send(html);
            utils.updateEvent(db, 'Loaded Survey page', null, userid, res);
          });
        }
        break;

      default:
        // Choices page
        res.render('index', {
          title: 'Choices' + title,
          data: {
            userid: userid,
            choiceNumber: doc.choice_number,
            movies: JSON.stringify(doc.choice_set[doc.choice_number-1] || [])
          }
        }, function(err, html) {
          res.send(html);
          utils.updateEvent(db, 'Loaded Choice set', doc.choice_number+1, userid, res);
        });
    }
  });

  // Save the user agent from which the user is connecting
  utils.updateEvent(db, 'New connection', req.useragent, userid, res);
});

module.exports = router;