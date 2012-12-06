var http = require('http'),
	monitor = require('../site-monitor'),
	server = null;

describe('site-monitor', function () {

	it('should monitor site', function ( done ) {

		monitor(require('../config'));

		setTimeout(function () {
			console.log('verify your email for a down notification.');
			
			//bring the server up
			server = http.createServer(function ( req, res ) {
				res.end('hello world');
			}).listen(8080);

			setTimeout(function () {
				console.log('verify your email for an up notification');
				done();
			}, 10000);
		}, 2000);

	});

});
