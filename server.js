// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var requiredHeaders = parseEnvList(process.env.CORS_REQUIRED_HEADERS);
var originBlacklist = parseEnvList(process.env.CORS_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORS_WHITELIST);
var targetWhitelist = parseEnvList(process.env.CORS_TARGET_WHITELIST);
var jwtJwksUri = process.env.CORS_JWT_JWKSURI;
var jwtIssuer = process.env.CORS_JWT_ISSUER;
var jwtAudience = process.env.CORS_JWT_AUDIENCE;
var jwtCheck = process.env.CORS_JWT_CHECK === 'true';

function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require('./lib/cors-anywhere');
cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  targetWhitelist: targetWhitelist,
  jwtConfig: {
    jwtCheck: jwtCheck,
    jwksUri: jwtJwksUri,
    issuer: jwtIssuer,
    audience: jwtAudience,
  },
  requireHeader: requiredHeaders,
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-heroku-queue-wait-time',
    'x-heroku-queue-depth',
    'x-heroku-dynos-in-use',
    'x-request-start',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
}).listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
