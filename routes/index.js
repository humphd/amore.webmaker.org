module.exports = {
  index: function( req, res ) {
    res.render( "index.html" );
  },
  data: function( req, res ) {
    res.render( "data.html" );
  }
};
