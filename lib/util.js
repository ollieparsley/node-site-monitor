//Native lib
var util = require('util');

/**
 * Async for each
 *
 * An asynchronous for each
 */
util.asyncForEach = function(array, fn, callback) {
	var completed = 0;
	if(array.length === 0) {
		callback(); // done immediately
	}
	var len = array.length;
	for(var i = 0; i < len; i++) {
		fn(array[i], function() {
			completed++;
			if(completed === array.length) {
				callback();
			}
		});
	}
};


module.exports = util;