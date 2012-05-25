// 3rd party
var connect = require('connect');
var request = require('request');

// local
var cookie_session = require('..');

var app = connect();
app.use(connect.cookieParser());
app.use(cookie_session({
    secret: 'foobar'
}));
app.use(function(req, res){
    res.end('hello world\n');
});

test('foo', function(done) {
    app.listen(3000, function() {
        request('http://localhost:3000', function(err, res, body) {
            assert.false(err);

            console.log(res);
        });
    });
});

