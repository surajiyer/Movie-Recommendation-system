"use strict";
var userID = data.userid;

$(document).ready(function() {
  $('#start').click(function() {
		start();
	});

	// Make sure client wants leave
  $(window).on('beforeunload', function() {
    if(confirmUnload)
      return 'We would really appreciate it if you could complete this survey for our course project.'
            + ' You can also come back to complete it later on from where you left.';
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
      confirmUnload = false;
      location.reload();
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}