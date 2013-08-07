# yummy [![Build Status](https://secure.travis-ci.org/shtylman/node-yummy.png?branch=master)](http://travis-ci.org/shtylman/node-yummy) #

Yummy is cookie session middleware for connect and its derivatives.

## why?

Cause you already have to use a cookie for sessions so why do more IO to get the data? Yummy encrypts the session data to prevent tampering as well as reading of the raw session data by the client.

## how?

```
npm install yummy
```

Just drop the yummy middleware into your middleware stack after the cookie parser

```javascript

var yummy = require('yummy');

app.use(connect.cookieParser());
app.use(yummy({
    // see notes about the secret below, this is important!!
    secret: '+lc|x[})E.S+ld2c@,u^abZ-v@jxJX,Y'
}));
```

## tell me more

You can configure yummy with the following options.

### secret [required]
> the cookie will be encrypted using this secret string, keep it safe :)

> The default encryption is aes256 which means your secret should be at least 256 bits (32 characters). It is best if you use a randomly generated string.

### cookie [optional]
> the cookie options sets the default value for session cookies. You can

> I would suggest setting `httpOnly: true` and `secure: true` for a more secure setup in production.

#### maxAge
> the max age of the cookie in seconds

#### path
> the path of the session cookie (default is '/')

## websockets

If you want to authenticate users for websocket sessions, the middleware exposes a `decode` property. The property will decode cookie strings.

```javascript

var middleware = yummy({ secret: ... });

// in the websocket auth
// cookies is an object of cookie name -> values
var session = middleware.decode(cookies);

// session is now populated with the session data
```

