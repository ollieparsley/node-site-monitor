var fs = require('fs');
var util = require('./lib/util');
var storages = require('./lib/storage');
var communications = require('./lib/communication');
var Site = require('./lib/site');

module.exports = function ( config ) {

	if ( !config ) { config = require('./config.json'); }

	//Sites
	var sites = [];

	//Storage
	var storage = new (storages.findByType(config.storage.type));

	//Add each site in the config into the array
	config.sites.forEach(function(siteConfig){
		sites.push(new Site(siteConfig));
	});

	//Run the checks
	var runChecks = function(){
		util.asyncForEach(sites, function(site){
			//Check the site requires a check
			if (site.requiresCheck()) {
				site.check(function(stats){
					//Up down
					var up_down = false;
					
					//Check for different situations
					if (site.isDown() && !site.wasDown()) {
						storage.logFailure(site, stats);
						up_down = 'down';
						
					} else if (!site.isDown() && site.wasDown()) {
						//Site is up and was down
						storage.logSuccess(site, stats);
						up_down = 'up';
						
					} else if (site.isDown() && site.wasDown()) {
						//Site still down
						storage.logFailure(site, stats);
						
					} else {
						//All is good in the hood
						storage.logSuccess(site, stats);
						
					}
					
					//Only carry on if the stats of the site has changed
					if (up_down !== false) {
						
						//Check one more time after a half second delay
						setTimeout(function(){
							site.check(function(stats){
								//Stats is the same as previous check
								if (site.isDown() === site.wasDown()) {
									//Send alerts to available users
									config.users.forEach(function(user){
										user.contact_methods.forEach(function(communicationMethod){
											//Send
											var commsClass = communications.findByType(communicationMethod.type);
											var comms = new commsClass({username:user.username}, communicationMethod, config);
											if (comms.isAllowed()) {
												comms.send(up_down, site, stats, function(success, error){
													if (success) {
														storage.logCommunicationSuccess(site, comms);
													} else {
														storage.logCommunicationFailure(site, comms, error);
													}
												});
											}
										});
									});
									
								} else {
									//Log the false alarm!
									storage.logFalseAlarm(site);
								}

							}.bind(this));
							
						}.bind(this), 500);
					}
				});
			}
		});
	}

	console.log("running checks");
	//Run the first check now
	runChecks();

	//Run further checks
	setInterval(function(){
		runChecks();
	}, 10 * 1000);
}