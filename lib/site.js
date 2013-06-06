var events = require('events');
var util = require('util');
var http = require('http');
var https = require('https');
var Url = require('url');

/** 
 * Site instance
 *
 * @param config Object the site configuration
 * 
 * @returns Site
 */
function Site(config, id) {
	events.EventEmitter.call(this);

	//The ID
	this.id = id;

	//The id of the client
	this.config = config;

	//The name
	this.name = config.name;

	//Type
	this.type = config.type;
	
	//Url
	this.url = config.url;
	
	//Content
	this.content = config.content !== undefined && config.content.length > 0 ? config.content : null;
	
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
		if (stats.statusCode !== 304 && (stats.statusCode < 200 || stats.statusCode > 299)) {
			//Not a good status code
			this.down = true;
			stats.notes = 'A non 304 or 2XX status code';
			
		} else if (stats.contentMatched === false) {
			//Content didn't match
			this.down = true;
			
		} else {
			//Up
			this.down = false;
		}
		
		//Callback
		callback(stats);
	}.bind(this));
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
		contentMatched: null,
		request: null,
		response: null,
		body: null,
		statusCode: null,
		notes: null
	};
	
	//Create the request
	var url = Url.parse(this.url);
	var httpModule = http;
	if (url.protocol.substr(0,5) === "https") {
		httpModule = https;
		url.port = url.port ? url.port : 443;
	} else {
		url.port = url.port ? url.port : 80;
	}
	
	var request = httpModule.request({
		port:    url.port,
		host:    url.host,
		path:    url.path,
		headers: {
			'User-Agent': 'node-site-monitor/0.1.0',
		},
		method:  'GET',
		agent:   false

	}, function ( response ) {

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
			
			//Check the content matched
			if (this.content !== null) {
				if (stats.body.indexOf(this.content) >= 0) {
					stats.contentMatched = true;
				} else {
					stats.contentMatched = false;
					stats.notes = 'The site content did not contain the string: "' + this.content + '"';
				}
			}
			
			callback(stats);
		}.bind(this));
		
	}.bind(this));
	
	stats.request = request;

	//Create the response timeout timer
	var connectTimeout = setTimeout(function() {
		request.abort();
		stats.connectTimeout = true;
		stats.connectFailed = true;
		callback(stats);
	}.bind(this), this.timeout * 1000);
	
	//Attach error handlers
	request.on('error', function(err) {
		//Connection error
		stats.connectFailed = true;
		clearTimeout(connectTimeout);
		callback(stats);
	});
	
	//End the request and start receiving the response
	request.end();
};
