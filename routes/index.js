module.exports = function( i18n ) {
  return {
    index: function( req, res ) {
      res.render( "index.html" );
    },
    data: function( req, res ) {
      res.render( "data.html" );
    },
    strings: function( req, res ) {
      // Send the entire string catalog as JSON to the client
      res.jsonp( i18n.getStrings( req.lang || "en_US" ) );
    }
  };
};
