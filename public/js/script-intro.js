"use strict";
var userID = data.userid;

$(document).ready(function() {
  $('#start').click(function() {
		start();
	});

	// Make sure client wants leave
  $(window).on('beforeunload', function() {
    return 'We would really appreciate it if you could complete this survey for our course project. It means a lot to us. Thank you.';
  });
});

/**
 * Update choice number and reload to start.
 */
function start() {
  $.ajax({
    type: 'POST',
    url: serverUrl + '/api/update/choicenumber',
    data: {
      userID: userID
    },
    dataType: 'json',
    success: function(result) {
      location.reload();
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}