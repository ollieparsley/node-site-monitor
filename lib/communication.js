module.exports = {
	Base: require('./communication/base'),
	findByType: function(){
		return this.Base;
	}
};