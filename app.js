// Bring in all your require modules
var express = require( "express" ),
    habitat = require( "habitat" ),
    nunjucks = require( "nunjucks" ),
    path = require( "path" ),
    i18n = require( "./lib/i18n.js" );

// Load config from ".env"
habitat.load();

// Generate app variables
var app = express(),
    env = new habitat(),
    middleware = require( "./lib/middleware" ),
    nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname + '/views' ))),
    routes = require( "./routes" );

// Enable template rendering with nunjucks
nunjucksEnv.express( app );
// Don't send the "X-Powered-By: Express" header
app.disable( "x-powered-by" );

// Setup global middleware
app.use( express.logger());
// Always put the compression middleware high up in the chain
app.use( express.compress());
// Setup locales with i18n
app.use( i18n.abide({
  supported_languages: [ "db_LB", "de", "en_US", "es" ],
  default_lang: "en_US",
  translation_directory: "locale",
  localeOnUrl: true
}));
app.use( function( req, res, next ) {
  console.log(req.lang, req.lang_dir);
  next();
});
app.use( express.static( path.join( __dirname + "/public" )));
// bodyParser will parse "application/json", "application/x-www-form-urlencoded" and "multipart/form-data"
// requests and put the results on req.body and req.files. Handy!
// If you don't need to handle all three types then just use json(), urlencoded() or multipart() instead.
app.use( express.bodyParser());
// Attempt to use Express' routes defined below
app.use( app.router );
// Whenever you pass `next( someError )`, this middleware will handle it
app.use( middleware.errorHandler );

// Express routes
app.get( "/", routes.index );

// Start up the server
app.listen( env.get( "PORT", 3000 ), function() {
  console.log( "Server listening (Probably http://localhost:%d )", env.get( "PORT", 3000 ));
});
