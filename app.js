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
  supported_languages: [
    'ach', 'ady', 'af', 'am', 'an', 'ar', 'as', 'ast', 'az', 'be', 'be_BY', 'bg', 'bn', 'bo',
    'br', 'bs', 'ca', 'cs', 'cv', 'cy', 'da', 'da_DK', 'el', 'eo', 'et', 'eu', 'fa', 'fi',
    'fil', 'fr', 'ga', 'gd', 'he', 'hi', 'hr', 'ht', 'hu', 'hy', 'ia', 'id', 'is', 'it',
    'ja', 'ja_JP', 'jv', 'ka', 'kk', 'km', 'kn', 'ko', 'ku', 'la', 'lb', 'lt', 'lv', 'mi',
    'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my', 'ne', 'nl', 'no', 'nr', 'or', 'os', 'pa', 'pl',
    'pt', 'ro', 'ru', 'rw', 'sc', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sq_AL', 'sr',
    'sv', 'sw', 'ta', 'te', 'th_TH', 'ti', 'tl', 'tn', 'to', 'tr', 'tt', 'uk', 'ur', 'uz',
    'vec', 'vi', 'wa', 'wo', 'xh', 'yi', 'yo', 'zh', 'zu', 'db_LB', 'en_US'
  ],
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
app.get( "/strings/:lang?", routes.strings );
app.get( "/localized", routes.localized );

// Start up the server
app.listen( process.env.PORT || 3000, function() {
  console.log( "Server listening (http://localhost:3000)" );
});
