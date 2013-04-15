var monitor = require('./lib/monitor');

//Uncaught exception
process.on("uncaughtException", function(error) {
	console.log("Uncaught Exception: " + error + " TRACE: " + error.stack);
});

//Start monitoring
monitor(require('./config.json'));