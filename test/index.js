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
    secret: '+lc|x[})E.S+ld2c@,u^abZ-v@jxJX,Y'
}));

app.use('/increment', function(req, res) {
    if (!req.session.count) {
        req.session.count = 0;
    }
    res.end(++req.session.count + '');
});

app.use(function(req, res){
    // must add something to the session otherwise it won't be set
    req.session.foo = 'bar';
    res.end('hello world\n');
});

test('foo', function(done) {
    var server = app.listen(function() {
        var addr = server.address();
        var port = addr.port;
        request('http://localhost:' + port, function(err, res, body) {
            assert.ok(!err);

            var cookie = res.headers['set-cookie'][0];
            assert.equal(body, 'hello world\n');
            var exp = 'connect.sess=Z9Nd%2F3ZFtCfjoj0AjTynVlmu%2FEAuWUyHaLQlnpMhNrAE3qL4aDjKF5siMJFAlNAgKHnwIEOmZD7UkVpiI6eVvQ%3D%3D; Path=/; HttpOnly';
            assert.equal(cookie, exp);

            server.close();
        });
    });

    server.on('close', function() {
        done();
    });
});

test('counter', function(done) {

    var server = app.listen(function() {
        var addr = server.address();
        var port = addr.port;

        request('http://localhost:' + port + '/increment', function(err, res, body) {
            assert.ok(!err);
            assert.equal(body, 1);
            request('http://localhost:' + port + '/increment', function(err, res, body) {
                assert.ok(!err);
                assert.equal(body, 2);

                server.close();
            });
        });
    });

    server.on('close', function() {
        done();
    });
});

test('decipher fail', function(done) {
    var server = app.listen(function() {
        var addr = server.address();
        var port = addr.port;

        var jar = request.jar();

        // add an invalid cookies string to cause decipher failure
        jar.add(request.cookie('connect.sess=hahaha; Path=/'));

        var opt = {
            url: 'http://localhost:' + port + '/increment',
            jar: jar
        }

        request(opt, function(err, res, body) {
            assert.ok(!err);
            assert.equal(body, 1);

            // reset cookie to invalid state so session is reset
            jar.add(request.cookie('connect.sess=hahaha; Path=/'));

            request(opt, function(err, res, body) {
                assert.ok(!err);
                assert.equal(body, 1);

                server.close();
            });
        });
    });

    server.on('close', function() {
        done();
    });
});

