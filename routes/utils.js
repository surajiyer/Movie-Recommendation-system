"use strict";

/**
 * Pad a string with zero's on the left to required length.
 */
var pad = function(str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
};

/**
 * Send an error response.
 */
var sendErr = function(res, msg) {
	res.status(500).json({ 'success': false, 'result': msg });
};

/**
 * Log events
 */
var updateEvent = function(db, event, eventdesc, userid, res) {
	var events = db.get('events');
	events.insert({
		timestamp: new Date(), 
		event: event, 
		decr: eventdesc, 
		userid: userid
	}, function(err) {
		if (err) return sendErr(res, 'Failed to log event.');
	});
};

module.exports = {
	pad: pad,
	sendErr: sendErr,
	updateEvent: updateEvent
};