/*********************/
var spaceeEmail = '';
var spaceeAcceptedSubject = '<null>';
var spaceeCancelledSubject = '<null>';
var spaceeTitles = {
  firstFloor: '',
  secondFloor: '',
};
var googleCalendars = [
  {
    key: 'firstFloor',
    calendarId: '',
    title: '1F Reserved'
  },
  {
    key: 'secondFloor',
    calendarId: '',
    title: '2F Reserved'
  }
];
var identifier = 'spacee';
var checkedIdentifier = 'spacee_checked';
/*********************/

function listLabels() {
  withManager(getAcceptedMessages(), function (manager) {
    manager.createEventMatchWith(googleCalendars);
  });
  withManager(getCancelledMessages(), function (manager) {
    manager.deleteEventMatchWith(googleCalendars);
  });
}

function withManager(messages, callback) {
  messages.forEach(function (message) {
    var reader = new MessageReader(message.id, message.threadId);
    
    for (key in spaceeTitles) {
      reader.registerKeyMatchWith(key, spaceeTitles[key]);
    }
    
    var manager = new EventManager(reader);
    callback(manager);
  });
}

function getAcceptedMessages() {
  return Gmail.Users.Messages.list('me', {
    q: 'from:' + spaceeEmail + ' subject:' + spaceeAcceptedSubject + ' label:' + identifier
  }).messages || [];
}

function getCancelledMessages() {
  return Gmail.Users.Messages.list('me', {
    q: 'from:' + spaceeEmail + ' subject:' + spaceeCancelledSubject + ' label:' + identifier
  }).messages || [];
}

function convertToDate(year, month, date, hour, minute) {
  return new Date([year, month, date].join('-') + 'T' + ([hour, minute, '00'].join(':')));
}

function EventManager(messageReader) {
  this.messageReader = messageReader;
}

EventManager.prototype.createEventMatchWith = function (params) {
  for (var i = 0; params.length > 0; i++) {
    var props = params[i];
    if (props && this.messageReader.hasKey(props.key)) {
      CalendarApp
      .getCalendarById(props.calendarId)
      .createEvent(props.title, this.messageReader.fromDate, this.messageReader.toDate);
      this.messageReader.markAsChecked();
    }
  }
};

function MessageReader(messageId, threadId) {
  this.messageId = messageId;
  this.threadId = threadId;
  this.messageBody = GmailApp.getMessageById(messageId).getBody();
  this._keys = {};
  this._dateParts = null;
}

MessageReader.prototype.registerKeyMatchWith = function (key, subject) {
  this._keys[key] = !!this.messageBody.match(new RegExp(subject));
};

MessageReader.prototype.markAsChecked = function () {
  var thread = GmailApp.getThreadById(this.threadId);
  GmailApp.getUserLabelByName(identifier).removeFromThread(thread);
  GmailApp.getUserLabelByName(checkedIdentifier).addToThread(thread);
};

MessageReader.prototype.hasKey = function (key) {
  return !!this._keys[key];
};

MessageReader.prototype._getDateParts = function () {
  if (this._dateParts === null) {
    var d = this.messageBody.match(/([0-9]{4})年([0-9]{2})月([0-9]{2})日 ([0-9]{2}):([0-9]{2})〜([0-9]{2}):([0-9]{2})/);
    this._dateParts = {
      year: d[1],
      month: d[2],
      date: d[3],
      fromHour: d[4],
      fromMinute: d[5],
      toHour: d[6],
      toMinute: d[7]
    };
  }
  return this._dateParts;
};

Object.defineProperties(MessageReader.prototype, {
  'fromDate': {
    get: function () {
      var parts = this._getDateParts();
      return convertToDate(
        parts.year,
        parts.month,
        parts.date,
        parts.fromHour,
        parts.fromMinute
      );
    }
  },
  'toDate': {
    get: function () {
      var parts = this._getDateParts();
      return convertToDate(
        parts.year,
        parts.month,
        parts.date,
        parts.toHour,
        parts.toMinute
      );
    }
  }
});
