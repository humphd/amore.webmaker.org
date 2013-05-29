// Load localized HTML via the text plugin, put into the page
require( [ 'text!/data', 'domFragment' ], function( data, domFragment ) {
  var container = document.querySelector( "#container" );
  container.appendChild( domFragment( data ) );
});
