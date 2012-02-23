var fs = require('fs');
var util = require('./lib/util');
var storages = require('./lib/storage');
var communications = require('./lib/communication');
var Site = require('./lib/site');

//Get the config
var config = JSON.parse(fs.readFileSync('./config.json','utf8')); 

//Sites
var sites = [];

//Storage
var storage = new storages.Base(config);

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
				
				if (up_down !== false) {
					//Site was up and is now down
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
										storage.logCommunicationFailed(site, comms, error);
									}
								});
							}
						});
					});
				}
			});	
		}
	});
}

//Run the first check now
runChecks();

//Run further checks
setInterval(function(){
	runChecks();
}, 10 * 1000);