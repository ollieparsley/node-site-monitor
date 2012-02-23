module.exports = {
	Base: require('./communication/base'),
	//File: require('./storage/file')
	findByType: function(){
		return this.Base;
	}
};