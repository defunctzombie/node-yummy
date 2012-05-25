// builtin
var crypto = require('crypto');

// 3rd party
var connect = require('connect');

module.exports = function (options) {
    var Cookie = connect.session.Cookie;
    var options = options || {};
    var key = options.key || 'connect.sess';
    var cookie_options = options.cookie;
    var secret = options.secret;

    return function (req, res, next) {
        var raw = req.cookies[key];
        req.session = req.session || {};

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
        var cookie = new Cookie(req.session.cookie || cookie_options);

        if (req.session.cookie) {
            var expires = req.session.cookie.expires;
            cookie.expires = new Date(expires);
        }

        // for app access
        // TODO consider just making methods on session to hide cookie?
        req.session.cookie = cookie;

        // clear all session variables
        req.session.reset = function() {
            req.session = {};
            req.session.cookie = cookie;
        };

        res.on('header', function() {

            // if session was removed, remove from user
            if (!req.session) {
                return res.clearCookie(key);
            }

            var val = JSON.stringify(req.session);

            var cipher = crypto.createCipher('aes192', secret);
            val = cipher.update(val, 'utf8', 'base64');
            val += cipher.final('base64');

            // timestamp prevents cipher from being the same text every request
            req.session.ts = Date.now();

            // TODO check that session and cookie data changed before setting
            res.setHeader('Set-Cookie', req.session.cookie.serialize(key, val));
        });

        next();
    };
};
