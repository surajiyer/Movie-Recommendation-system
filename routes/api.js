var express = require('express');
var router = express.Router();

/* GET movies by movie _id or imdbID. */
router.get('/movies', function(req, res, next) {
	var db = req.db;
  var collection = db.get('movies');

  if(req.query.id) {
	  var id = Number(req.query.id);
	  collection.find({'_id': id}, {}, function(err, docs) {
	  	if (err) console.error(err);
	  	res.json(docs);
	  });
	} else if(req.query.imdbID) {
		var id = Number(req.query.imdbID);
	  collection.find({'imdbID': id}, {}, function(err, docs) {
	  	if (err) console.error(err);
	  	res.json(docs);
	  });
	}
});

module.exports = router;
