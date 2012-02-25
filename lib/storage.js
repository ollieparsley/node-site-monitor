module.exports = {
	Base: require('./storage/base'),
	findByType: function(){
		return this.Base;
	}
};