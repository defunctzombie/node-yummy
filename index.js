// builtin
var crypto = require('crypto');

// 3rd party
var cookie = require('cookie');

var cypher_algo = 'aes256';

var decode = function(cookies, key, secret) {
    // accept a raw cookie header string
    if (typeof cookies === 'string') {
        cookies = cookie.parse(cookies);
    }

    var raw_cookie = cookies[key];
    if (!raw_cookie) {
        return {};
    }

    // try to decipher the session cookie
    // if this fails we assume the cookie was altered or something bad happend
    // in this case we clear the session state as if a blank session was started
    var decipher = crypto.createDecipher(cypher_algo, secret);
    var body = decipher.update(raw_cookie, 'base64', 'utf8');
    body += decipher.final('utf8');

    try {
        return JSON.parse(body);
    } catch (e) {
        // no-op, will default to empty session
    }

    return {};
};

module.exports = function (options) {
    var options = options || {};

    // key is the name of the cookie that stores the session data
    var key = options.key || 'connect.sess';

    // hush hush
    var secret = options.secret;

    // default value for session cookie
    var cookie_options = options.cookie || {};

    // default path is '/';
    cookie_options.path = cookie_options.path || '/';

    if (!secret) {
        throw new Error('`secret` required for yummy sessions');
    }

    return function (req, res, next) {
        req.session = decode(req.cookies, key, secret);

        // create a cookie object using the saved cookie state
        // if no saved state, default object created
        var cookie_opt = req.session.cookie || cookie_options;

        // for app access to set cookie options
        req.session.cookie = cookie_opt;

        // clear all session variables
        req.session.reset = function() {
            req.session = {};
            req.session.cookie = cookie_opt;
        };

        // force refresh of the cookie, useful for rolling sessions
        var refresh = false;
        req.session.touch = function() {
            refresh = true;
        };

        // store original value to identify if cookie changed
        // if unchanged, it will not be resent to client
        var orig = JSON.stringify(req.session);

        res.on('header', function() {

            // if session was removed, remove from client
            if (!req.session) {
                return res.clearCookie(key);
            }

            var val = JSON.stringify(req.session);

            // if the session data did not change no need to resend cookie
            if (val === orig && !refresh) {
                return;
            }

            var cipher = crypto.createCipher(cypher_algo, secret);
            val = cipher.update(val, 'utf8', 'base64');
            val += cipher.final('base64');

            res.setHeader('Set-Cookie', cookie.serialize(key, val, req.session.cookie));
        });

        next();
    };
};

module.exports.decode = decode;

