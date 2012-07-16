# yummy [![Build Status](https://secure.travis-ci.org/shtylman/node-yummy.png?branch=master)](http://travis-ci.org/shtylman/node-yummy) #

Yummy is cookie session middleware for connect and its derivatives.

## why?

Cause you already have to use a cookie for sessions so why do more IO to get the data.

## how?

```
npm install yummy
```

Just drop the yummy middleware into your middleware stack after the cookie parser

```javascript

var yummy = require('yummy');

app.use(connect.cookieParser());
app.use(yummy({
    secret: 'fizzbuzz'
});
```

## tell me more

You can configure yummy with the following options.

### secret [required]
> the cookie will be encrypted using this secret string, keep it safe :)

### cookie [optional]
> the cookie options sets the default value for session cookies. You can

#### maxAge
> the max age of the cookie in milliseconds

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

