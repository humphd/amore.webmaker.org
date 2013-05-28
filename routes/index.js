module.exports = {
  index: function( req, res ) {
    res.render( "index.html", {
      iloveyou: req.gettext( "I love you" ),
      lang: req.lang,
      lang_dir: req.lang_dir
    });
  }
};
