// builtin
var assert = require('assert');

// 3rd party
var connect = require('connect');
var request = require('request');

// local
var yummy = require('..');

var app = connect();
app.use(connect.cookieParser());
app.use(yummy({
    secret: 'foobar'
}));
app.use(function(req, res){
    // must add something to the session otherwise it won't be set
    req.session.foo = 'bar';

    res.end('hello world\n');
});

test('foo', function(done) {
    app.listen(3000, function() {
        request('http://localhost:3000', function(err, res, body) {
            assert.ok(!err);

            var cookie = res.headers['set-cookie'][0];
            assert.equal(cookie, 'connect.sess=D3GwAkYil7UBsk3NBzW1RThSvV2FJPtR8cMDaDswJFYFgqsdXhN0Zw9ZssNraWL%2B; Path=/');
            done();
        });
    });
});

