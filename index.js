// builtin
var crypto = require('crypto');

// 3rd party
var crumbs = require('crumbs');

module.exports = function (options) {
    var options = options || {};

    // key is the name of the cookie that stores the session data
    var key = options.key || 'connect.sess';

    // hush hush
    var secret = options.secret;

    // default value for session cookie
    var cookie_options = options.cookie;

    if (!secret) {
        throw new Error('`secret` required for yummy sessions');
    }

    return function (req, res, next) {
        var raw = req.cookies[key];
        req.session = req.session || {};

        // try to decipher the session cookie
        // if this fails we assume the cookie was altered or something bad happend
        // in this case we clear the session state as if a blank session was started
        if (raw) {
            var decipher = crypto.createDecipher('aes192', secret);
            var body = decipher.update(raw, 'base64', 'utf8');
            body += decipher.final('utf8');

            try {
                req.session = JSON.parse(body);
            } catch (e) {
                // bad parsing, clear session
                // TODO option to send error to next?

                // bad parse
                req.session = {};
            }
        }

        // create a cookie object using the saved cookie state
        // if no saved state, default object created
        var cookie = new crumbs.Cookie(req.session.cookie || cookie_options);

        // why is this here?
        if (req.session.cookie) {
            var expires = req.session.cookie.expires;
            cookie.expires = new Date(expires);
        }

        // for app access
        req.session.cookie = cookie;

        // clear all session variables
        req.session.reset = function() {
            req.session = {};
            req.session.cookie = cookie;
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
            if (val === orig) {
                return;
            }

            var cipher = crypto.createCipher('aes192', secret);
            val = cipher.update(val, 'utf8', 'base64');
            val += cipher.final('base64');

            res.setHeader('Set-Cookie', req.session.cookie.serialize(key, val));
        });

        next();
    };
};
