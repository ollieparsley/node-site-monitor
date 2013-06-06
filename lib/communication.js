module.exports = {
	Base: require('./communication/base'),
	Mqtt: require('./communication/mqtt'),
	findByType: function(type){
		if (type === "mqtt") {
			return this.Mqtt;
		} else {
			return this.Base;
		}
	}
};