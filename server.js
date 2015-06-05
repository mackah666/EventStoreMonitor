// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var uuid = require('node-uuid');
var EventStoreClient = require('event-store-client');

// Sample application to demonstrate how to use the Event Store Client
/*************************************************************************************************/
// CONFIGURATION
var config = {
    'eventStore': {
        'address': "127.0.0.1",
        'port': 1113,
        'stream': 'Monitoring',
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


console.log('Subscribing to ' + streamId + "...");
var correlationId = connection.subscribeToStream(streamId, true, function(streamEvent) {
    onEventAppeared(streamEvent);
}, onSubscriptionConfirmed, onSubscriptionDropped, credentials);

/*************************************************************************************************/




// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 3000;        // set our port



// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	var newEvent = {
    eventId: uuid.v1(),
    eventType: 'MonitorEvent',
	    data: {
	    	id: uuid.v1(),
	        textProperty: "monitoring",
	        numericProperty: 42,
	        dept: "DevOps"
	    }
   
	};

	var newEvents = [ newEvent ];
	console.log('Writing event to ' + streamId + '...');
	connection.writeEvents(streamId, EventStoreClient.ExpectedVersion.Any, false, newEvents, credentials, function(completed) {
	    console.log('Events written result: ' + EventStoreClient.OperationResult.getName(completed.result));
	});

	console.log("send response");

    res.json({ message: 'hooray! welcome to our api!' });   
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);





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