// builtin
var crypto = require('crypto');
var Buffer = require('buffer').Buffer;

// 3rd party
var cookie = require('cookie');

module.exports = function (options) {
    var options = options || {};

    // key is the name of the cookie that stores the session data
    var key = options.key || 'connect.sess';

    // hush hush
    var secret = options.secret;

    // default value for session cookie
    var cookie_options = options.cookie || {};

    // user can opt to use other algorithms
    var algorithm = options.algorithm || 'aes256';

    // default path is '/';
    cookie_options.path = cookie_options.path || '/';

    // no script access by default
    // user must explicitly enable this because of the security implications
    if (cookie_options.httpOnly === undefined) {
        cookie_options.httpOnly = true;
    }

    if (!secret) {
        throw new Error('`secret` required for yummy sessions');
    }

    // decode a cookie string or pull the cookie value from an object (cookies)
    var decode = function(cookies) {
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
        try {
            var decipher = crypto.createDecipher(algorithm, secret);
            var body = decipher.update(raw_cookie, 'base64', 'utf8');
            body += decipher.final('utf8');

            return JSON.parse(body);
        } catch (e) {
            // no-op, will default to empty session
        }

        return {};
    };

    var middleware = function (req, res, next) {
        req.session = decode(req.cookies);

        // create a cookie object using the saved cookie state
        // if no saved state, default object created
        var cookie_opt = req.session.cookie || cookie_options;

        // if cookie was requested over secure connection
        // make sure the secure flag is set
        // if secure flag is already set, then don't set it again
        if (req.secure && cookie_opt.secure === undefined) {
            cookie_opt.secure = true;
        }

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

        var writeHead = res.writeHead;
        res.writeHead = function () {
            // if session was removed, remove from client
            if (!req.session) {
                res.clearCookie(key);
                return writeHead.apply(res, arguments);
            }

            var val = JSON.stringify(req.session);

            // if the session data did not change no need to resend cookie
            if (val === orig && !refresh) {
                return writeHead.apply(res, arguments);
            }

            var cipher = crypto.createCipher(algorithm, secret);
            val = cipher.update(val, 'utf8', 'binary') + cipher.final('binary');

            // convert to base64 for less bytes
            val = Buffer(val, 'binary').toString('base64');

            res.setHeader('Set-Cookie', cookie.serialize(key, val, req.session.cookie || cookie_opt));
            return writeHead.apply(res, arguments);
        };

        next();
    };

    // expose the decode method for use by websockets, etc
    middleware.decode = decode;

    return middleware;
};

