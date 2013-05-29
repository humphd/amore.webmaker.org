define(function(){
  // domFragment( "...html...", "#elem-id" );
  return function domFragment( inputString, immediateSelector ) {
    var range = document.createRange(),
        container = document.body || document.head,
        fragment,
        child;

    range.selectNode( container );
    fragment = range.createContextualFragment( inputString );

    if( immediateSelector ){
      child = fragment.querySelector( immediateSelector );
      if ( child ) {
        child.parentNode.removeChild( child );
        return child;
      }
    }

    return fragment;
  };
});
