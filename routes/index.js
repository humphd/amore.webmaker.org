module.exports = function( i18n ) {
  return {
    index: function( req, res ) {
      res.render( "index.html" );
    },
    data: function( req, res ) {
      res.render( "data.html" );
    },
    localized: function( req, res ) {
      res.render( "localized-js.html" );
    },
    strings: function( req, res ) {
      // Send the entire string catalog as JSON to the client.
      // We expect the web page to ask for a particular locale
      // or for the headers to include it.  If neither of these
      // happens, we'll default to en_US.
      res.jsonp( i18n.getStrings( req.params.lang || req.lang ) );
    }
  };
};
