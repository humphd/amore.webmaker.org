exports.errorHandler = function( err, req, res, next ) {
  res.send( err.status );
};
