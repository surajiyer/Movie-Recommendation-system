"use strict";
var nrOfQns = $('.qn').length;
var userid = data.userid;

$(document).ready(function() {
	$('#finish').click(function() {
		if(isSurveyComplete()) {
      postEvent('Clicked "Finish"', null);
			finish();
    }
		else 
			alert("Oops! Looks like the some questions haven't been answered yet.");
	});

	// Make sure client wants leave
  $(window).on('beforeunload', function() {
    if(confirmUnload)
      return 'We would really appreciate it if you could complete this survey for our course project.'
            + ' You can also come back to complete it later on from where you left.';
  });

  $(window).unload(function() {
    postEvent('Closed connection', null);
  });
});

/**
 * Save survey answers online and finish.
 */
function finish() {
	var answers = [];
	for(var i=1; i<=nrOfQns; i++) {
		answers.push($('input[name=qn'+i+']:checked').val());
	}

	$.ajax({
    type: 'POST',
    url: '/api/update/answers',
    data: {
      userid: userid,
      answers: JSON.stringify(answers)
    },
    dataType: 'json',
    success: function() {
      confirmUnload = false;
    	location.reload(true);
    },
    error: function(err) {
      console.log(err.responseText);
    }
  });
}

/**
 * Check if all questions have been answered.
 */
function isSurveyComplete() {
	for(var i=1; i<=nrOfQns; i++) {
		if (!$('input[name=qn'+i+']:checked').length) {
			return false;
		}
	}
	return true;
}

/**
 * Log any events on the backend.
 */
function postEvent(event, eventdesc) {
  $.ajax({
    type: 'POST',
    url: '/api/update/event',
    data: {
      userid: userid,
      event: event,
      eventdesc: eventdesc
    },
    dataType: 'json',
    error: function(err) {
      console.log(err.responseText);
    }
  });
}
