var events = require('events');
var util = require('util');
var http = require('http');
var Url = require('url');

/** 
 * Site instance
 *
 * @param config Object the site configuration
 * 
 * @returns Site
 */
function Site(config) {
	events.EventEmitter.call(this);

	//The id of the client
	this.config = config;

	//The name
	this.name = config.name;

	//Type
	this.type = config.type;
	
	//Url
	this.url = config.url;
	
	//Content
	this.content = config.content;
	
	//Interval
	this.interval = config.interval;
	
	//Timeout
	this.timeout = config.timeout;

	//Last run
	this.lastRun = 0;
	
	//Is down
	this.down = false;
	
	//Previous down
	this.previousDown = true;
	
}

//Inherit event emitter
util.inherits(Site, events.EventEmitter);

//Export
module.exports = Site;

/**
 * If the site is currently down or not
 *
 * @returns void
 */
Site.prototype.wasDown = function() {
	return this.previousDown;
}

/**
 * If the site is currently down or not
 *
 * @returns void
 */
Site.prototype.isDown = function() {
	return this.down;
}

/**
 * Requires a check or not
 *
 * @returns void
 */
Site.prototype.requiresCheck = function() {
	if ((this.lastRun + (this.interval * 1000)) < new Date().getTime()) {
		return true;
	} 
	return false;
}


/**
 * Check
 *
 * @returns void
 */
Site.prototype.check = function(callback) {
	//Make the request and then decide if the result was success or failure
	this.request(function(stats){
		//Set the preview down status
		this.previousDown = this.down ? true : false;
		
		//Check status
		if (stats.statusCode == 304 || (stats.statusCode >= 200 && stats.statusCode <= 299)) {
			//Success
			this.down = false;
		} else {
			//Fail
			this.down = true;
		}
		
		//Callback
		callback(stats);
	});
}


/**
 * Send an error message to the user
 *
 * @param message string the message to show to the user
 * 
 * @returns void
 */
Site.prototype.request = function(callback) {
	
	//Set the last run
	this.lastRun = new Date().getTime();
	
	//Keep the request meta data with the request
	var stats = {
		startTime: new Date().getTime(),
		connectTime: 0,
		responseTime: 0,
		connectTimeout: false,
		connectFailed: false,
		request: null,
		response: null,
		body: null,
		statusCode: null,
		notes: null
	};
	
	//Create the client
	var url = Url.parse(this.url);
	url.port = url.port ? url.port : 80;

	//Create the http client
	var client = http.createClient(url.port, url.host);
	
	//Add default headers
	var headers = {
		'Host': url.host + ':' + url.port,
		'User-Agent': 'node-site-monitor/0.1.0'
	};
	
	//Create the request
	var request = client.request('GET', url.pathname, headers);
	stats.request = request;

	//Create the response timeout timer
	var connectTimeout = setTimeout(function() {
		request.abort();
		stats.connectTimeout = true;
		stats.connectFailed = true;
		callback(stats);
	}.bind(this), this.timeout * 1000);
	
	//Attach error handlers
	client.on('error', function(err) {
		//Client error error
		stats.connectFailed = true;
		clearTimeout(connectTimeout);
		callback(stats);
	});
	request.on('error', function(err) {
		//Connection error
		stats.connectFailed = true;
		clearTimeout(connectTimeout);
		callback(stats);
	});

	//Response
	request.on('response', function(response) {
		
		//Response
		stats.response = response;
		
		//Status code
		stats.statusCode = response.statusCode;
		
		//Set the response time
		stats.connectTime = (new Date().getTime() - stats.startTime) / 1000;
		
		//Clear the request timeout
		clearTimeout(connectTimeout);
		request.connectTimeout = null;

		//Collect the body
		var body = '';
		response.on('data', function (chunk) {
			body += chunk.toString('utf8');
		});
		
		//Respond with whole body
		response.on('end', function () {
			stats.body = body;
			stats.responseTime = (new Date().getTime() - stats.startTime) / 1000;
			callback(stats);
		}.bind(this));
		
	}.bind(this));
	
	//End the request and start receiving the response
	request.end();
};

