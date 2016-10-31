var util = require('util');					// nodejs utilities (e.g. for logging)
var http = require('http');
var socketio = require('socket.io'); 		// Module for Websocket communication (incl. Fallbacks to jsonp and others)
var fs = require('fs');							// filesystem module: used for loading the index.html

// The following command is synchronous and should therefore only be executed on startup!
var index = fs.readFileSync(__dirname + '/pushpost.html');	// read the pushpost.html file from ~/www/nodejs/pushpost/

var app = http.createServer(function(req, res) {
	var testString = "";
	if(req.method == 'POST') {
		req.on('data', function(chunk) {
		  testString += chunk.toString();
		});
    
		req.on('end', function() {
		  // echo request to console
		  console.log("Received: "+testString);
		  
		  // Send message to each client with received data
		  io.sockets.emit('sensordata',testString);
		  
		  // Respond JSON-OK
		  res.writeHead(200, "OK", {'Content-Type': 'application/json'});
		  res.end("{\"result\":\"ok\"}");
		});
    } else {
		// Respond JSON-OK
          res.writeHead(200, "OK", {'Content-Type': 'text/html'});
	      res.end(index);
    }
});

// Advice socketio to listen to the app
var io = socketio.listen(app);

// Define the port to be used as webserver port 
// ! be aware that port 80 is already in use by the apache webserver on this machine !
var port = process.env.PORT || 1337;


// Every client connecting to a socket io service traverses through the connection method
io.on('connection', function(socket) {
	console.log('Client connected...');
});

// Start application and listen to provided port
app.listen(port);
console.log('Server running on port ' + port);
