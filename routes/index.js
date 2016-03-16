"use strict";
var express = require('express');
var router = express.Router();
var utils = require('./utils.js');
var title = ' | MRS';

/* GET error if no user id specified in URL. */
router.get('/', function(req, res, next) {
  next(new Error("Please type in some unique user ID at the end of the URL after the '/'"));
});

/* GET home page. */
router.get('/:id', function(req, res, next) {
  // Get the user id from the request
  var userID = utils.pad(req.params.id, 12);

  // Check if user id exists
  var db = req.db;
  var users = db.get('users');
  users.findById(userID, function(err, doc) {
    // If user not found,
    if (doc === null) {
      return users.insert({
        _id: userID,
        choiceNumber: -1,
        movies: [],
        finished: false
      }, function(err) {
        if (err) return next(err);
        res.render('intro', {
          title: 'Introduction' + title,
          data: {
            userid: userID
          }
        });
      });
    }

    // If user is found,
    switch(doc.choiceNumber) {
      case -1:
        // Introduction page
        res.render('intro', {
          title: 'Introduction' + title,
          data: {
            userid: userID
          }
        });
        break;

      case 10:
        var finish = typeof doc.answers != 'undefined' && doc.answers !== null;
        if(finish) {
          // Finish page
          res.render('finish', { 
            title: 'Finished' + title,
            data: {
              userid: userID
            }
          });
        } else {
          // Survey page
          if(doc.movies) {
            res.render('survey', {
              title: 'Final survey' + title,
              data: {
                userid: userID,
                movies: doc.movies
              }
            });
          } else {
            utils.sendErr(res, 'This should not occur.');
          }
        }
        break;

      default:
        // Choices page
        res.render('index', {
          title: 'Choices' + title,
          data: {
            userid: userID,
            choiceNumber: doc.choiceNumber,
            movies: doc.movies
          }
        });
    }
  });
});

module.exports = router;