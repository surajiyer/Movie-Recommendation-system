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
var sendErr = function sendErr(res, msg) {
	res.status(500).send({ error: msg });
};

module.exports = {
	pad: pad,
	sendErr: sendErr
};