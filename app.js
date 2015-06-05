var CronJob = require('cron').CronJob;
var uuid = require('node-uuid');
//var EventStoreClient = require("./index");
var EventStoreClient = require('event-store-client');

// Sample application to demonstrate how to use the Event Store Client
/*************************************************************************************************/
// CONFIGURATION
var config = {
    'eventStore': {
        'address': "127.0.0.1",
        'port': 1113,
        'stream': 'MackahSE',
        'credentials': {
            'username': "admin",
            'password': "changeit"
        }
    },
    'debug': false
};
/*************************************************************************************************/

// Connect to the Event Store
var options = {
    host: config.eventStore.address,
    port: config.eventStore.port,
    debug: config.debug
};
console.log('Connecting to ' + options.host + ':' + options.port + '...');
var connection = new EventStoreClient.Connection(options);
console.log('Connected');

// Ping it to see that its there
connection.sendPing(function(pkg) {
    console.log('Received ' + EventStoreClient.Commands.getCommandName(pkg.command) + ' response!');
});

// Subscribe to receive statistics events
var streamId = config.eventStore.stream;
var credentials = config.eventStore.credentials;

var written = false;
var read = false;
var readMissing = false;

var destinationId = "MackahSE";

console.log('Subscribing to ' + streamId + "...");
var correlationId = connection.subscribeToStream(streamId, true, function(streamEvent) {
    onEventAppeared(streamEvent);
}, onSubscriptionConfirmed, onSubscriptionDropped, credentials);





new CronJob('*/15 * * * * *', function() {

var newEvent = {
    eventId: uuid.v1(),
    eventType: 'MackahE',
    data: {
    	id: uuid.v1(),
        textProperty: "monitoring",
        numericProperty: 42,
        dept: "DevOps"
    }
   
};

var newEvents = [ newEvent ];
console.log('Writing event to ' + destinationId + '...');
connection.writeEvents(destinationId, EventStoreClient.ExpectedVersion.Any, false, newEvents, credentials, function(completed) {
    console.log('Events written result: ' + EventStoreClient.OperationResult.getName(completed.result));
});

}, null, true, 'America/Los_Angeles');





function onEventAppeared(streamEvent) {
    if (streamEvent.streamId != streamId) {
        console.log("Unknown event from " + streamEvent.streamId);
        return;
    }
    console.log("Event handled by subscriber!!!!!")
    console.log(streamEvent.eventNumber + " => " + streamEvent.eventId + " => " + streamEvent.data.dept//+ " - " +

    );
}

function onSubscriptionConfirmed(confirmation) {
    console.log("Subscription confirmed (last commit " + confirmation.lastCommitPosition + ", last event " + confirmation.lastEventNumber + ")");
}

function onSubscriptionDropped(dropped) {
    var reason = dropped.reason;
    switch (dropped.reason) {
        case 0:
            reason = "unsubscribed";
            break;
        case 1:
            reason = "access denied";
            break;
    }
    console.log("Subscription dropped (" + reason + ")");
}