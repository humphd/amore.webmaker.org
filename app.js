// Bring in all your require modules
var express = require( "express" ),
    nunjucks = require( "nunjucks" ),
    path = require( "path" ),
    i18n = require( "./lib/i18n.js" ),
    app = express(),
    nunjucksEnv = new nunjucks.Environment( new nunjucks.FileSystemLoader( path.join( __dirname, '/views' ))),
    routes = require( "./routes" )( i18n );

// Enable template rendering with nunjucks
nunjucksEnv.express( app );

app.use( express.logger());

// Setup locales with i18n
app.use( i18n.abide({
  supported_languages: [ "db_LB", "de", "en_US", "es" ],
  default_lang: "en_US",
  translation_directory: "locale",
  localeOnUrl: true
}));
// Dump locale info to console
app.use( function( req, res, next ) {
  console.log( "Using locale: %s", req.lang);
  next();
});
app.use( "/static", express.static( path.join( __dirname + "/static" )));

app.get( "/", routes.index );
app.get( "/data", routes.data );
app.get( "/strings", routes.strings );

// Start up the server
app.listen( 3000, function() {
  console.log( "Server listening (http://localhost:3000)" );
});
