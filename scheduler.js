function scheduler(startTime, endTime, email) {
  var event = CalendarApp.getDefaultCalendar().createEvent('Contract Inteview Video Meeting',
    new Date(startTime),
    new Date(endTime),
    {
      location: 'https://appear.in/athearth',
      guests: email,
      sendInvites: true
    });
  Logger.log('Event ID: ' + event.getId());
}

function getTodayEvents(day) {
  var events = CalendarApp.getDefaultCalendar().getEventsForDay(new Date(day));
  var eventTimes = []
  
  for (event in events) {
    eventTimes.push({
      start: events[event].getStartTime(),
      end: events[event].getEndTime()
    });
  }
  Logger.log('eventTimes: ' + JSON.stringify(eventTimes));
  return eventTimes;
}

function doPost(e) {
  var start = e.parameter.start;
  var end = e.parameter.end;
  var email = e.parameter.email;
  Logger.log('start: ' + start + ' end: ' + end + ' email: ' + email);
  scheduler(start, end, email);
  return ContentService.createTextOutput(JSON.stringify({
    message: 'ok'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var get_events_for = e.parameter.get_events_for;
  var callback = e.parameter.callback;
  var result = {
    events: getTodayEvents(get_events_for)
  };
  if (get_events_for) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}
