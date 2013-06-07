var events = require('events');
var util = require('util');
var http = require('http');
var Url = require('url');
var mqtt = require('mqtt');
var BaseCommunication = require("./base");


/** 
 * Base communication
 *
 * @param config Object the configuration
 * 
 * @returns Site
 */
function MqttCommunication(user, config, baseConfig) {
	BaseCommunication.call(this, user, config, baseConfig);
	
	//MQTT Brokers
	this.brokers = {};
	
	//MQTT Brokers
	var currentBrokerId = 0;
	
	var self = this;
	baseConfig.mqtt.brokers.forEach(function(brokerConfig){
		currentBrokerId++;
		var brokerId = "broker_" + (currentBrokerId.toString());

		//Options
		var options = {
			keepalive: 300,
			clientId:  brokerConfig.clientIdPrefix + "node-site-monitor",
			clean:     true,
			username:  brokerConfig.username,
			password:  brokerConfig.password
		};
		
		function connect() { 
			//Create client and assign to broker array
			var client = brokerConfig.secure ? mqtt.createSecureClient(brokerConfig.port, brokerConfig.host, options) : mqtt.createClient(brokerConfig.port, brokerConfig.host, options);

			//Add client connect event
			client.on("connect", function() {
				console.log("MQTT client connected to broker: " + options.clientId);
				self.brokers[brokerId] = client;
			}.bind(this));
			client.on("error", function(error) {
				console.log("Broker connection " + brokerId + " error: ", error);
			}.bind(this));
			client.on("close", function() {
				console.log("Broker connection close: " + brokerId);
				connect();
			}.bind(this));
		}

		//Connect now
		connect();

	}.bind(this));
	
	

}

//Inherit event emitter
util.inherits(MqttCommunication, BaseCommunication);

//Export
module.exports = MqttCommunication;
					
/**
 * Can send
 *
 * @returns void
 */
MqttCommunication.prototype.isAllowed = function() {
	return true;
}

/**
 * Log success
 *
 * @returns void
 */
MqttCommunication.prototype.send = function(up_down, site, stats, callback) {
	topic = this.config.topic;

	//Remove stats
	delete stats.response;
	delete stats.request;

	//Send to all brokers
	var self = this;
	console.log("MQTT sending to all brokers: " + topic);
	Object.keys(self.brokers).forEach(function(brokerId) {
		console.log("MQTT sending to broker " + brokerId + " on topic: " + topic);
		var broker = self.brokers[brokerId];
		broker.publish(
			topic,            //Topic
			JSON.stringify({
				"id":      site.id,
				"up":      up_down === "up" ? true : false,
				"title":   site.name + " is " + up_down + "!",
				"content": up_down === "up" ? "Woooo this site is back up!!" : "Oh crap the site is down!",
				"stats":   stats
			}),  //Message
			{qos:0,retain: false},        //Options
			function(){                   //Callback
				//Message sent
			}
		);
		
		console.log("Sent on broker: " + brokerId + " topic " + topic);

	}.bind(this));
	
	//Callback with true
	callback(true);
	
}
