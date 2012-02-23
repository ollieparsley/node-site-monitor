var events = require('events');
var util = require('util');
var http = require('http');
var Url = require('url');

/** 
 * Base storage
 *
 * @param config Object the configuration
 * 
 * @returns Site
 */
function BaseStorage(config) {
	events.EventEmitter.call(this);

	//The config
	this.config = config;

}

//Inherit event emitter
util.inherits(BaseStorage, events.EventEmitter);

//Export
module.exports = BaseStorage;

/**
 * Log success
 *
 * @returns void
 */
BaseStorage.prototype.logSuccess = function(site, stats) {
	//Remove the body, response and request
	delete stats.body;
	delete stats.response;
	delete stats.request;
	this.log("[SUCCESS] [" + site.name + "] [" + site.url + "] - " + JSON.stringify(stats));
}

/**
 * Log failure
 *
 * @returns void
 */
BaseStorage.prototype.logFailure = function(site, stats) {
	//Remove the body, response and request
	delete stats.body;
	delete stats.response;
	delete stats.request;
	this.log("[FAILURE] [" + site.name + "] [" + site.url + "] - " + JSON.stringify(stats));
}



/**
 * Log communication success
 *
 * @returns void
 */
BaseStorage.prototype.logCommunicationSuccess = function(site, communication) {
	this.log("[COMMS][SUCCESS] [" + site.name + "] [" + site.url + "]" + JSON.stringify(communication.toArray()));
}

/**
 * Log failure
 *
 * @returns void
 */
BaseStorage.prototype.logCommunicationFailure = function(site, communication, error) {
	this.log("[COMMS][FAILURE] [" + site.name + "] [" + site.url + "] - " + JSON.stringify(communication.toArray()) + ' - ' + error.stack);
}

/**
 * Log the message
 *
 * @returns void
 */
BaseStorage.prototype.log = function(message) {
	var date = new Date();
	var datedMsg = date.toDateString() + ' ' + date.toTimeString().substr(0, 8)
	console.log(datedMsg + ": " + message);
}