/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Based on Mozilla's i18n-abide module, but without the historical
 * Mozilla L10n ways of doing things.  Here we use plist files in
 * a locale/ directory (e.g., locale/en-US, locale/de, ...).
 */

var fs = require( 'fs' ),
  gobbledygook = require( 'gobbledygook' ),
  plist = require( 'plist' ),
  path = require( 'path' ),
  util = require( 'util' ),
  locales = {},
  logger;

const DAVID_B_LABYRN = 'db-LB';
const BIDI_RTL_LANGS = [ 'ar', DAVID_B_LABYRN, 'fa', 'he' ];

// forward references
var localeFrom, parseAcceptLanguage, bestLanguage, format;

/**
 * Connect middleware which is i18n aware.
 *
 * Usage:
  app.use(i18n.abide({
    supported_languages: ['en-US', 'fr', 'pl'],
    default_lang: 'en-US',
    translation_directory: 'locale'
  }));
 *
 * Other valid options: gettext_alias, debug_lang, disable_locale_check,
 * or logger
 */
module.exports = function( options ) {
  options = options || {};
  options.gettext_alias = options.gettext_alias || 'gettext';
  options.supported_languages = options.supported_languages || [ 'en-US' ];
  options.default_lang = options.default_lang || 'en-US';
  options.debug_lang = options.debug_lang || 'it-CH';
  options.disable_locale_check = options.disable_locale_check === true;
  options.translation_directory = options.translation_directory || 'locale';
  options.localeOnUrl = options.localeOnUrl === true;
  options.logger = options.logger || console;
  logger = options.logger;

console.log(options);

  var existsSync = fs.existsSync || path.existsSync,
    debug_locale = localeFrom( options.debug_lang );

  function resolveLocalePath( locale ) {
    return path.resolve( path.join( __dirname, '..' ),
      options.translation_directory,
      path.join( locale, 'messages.plist' ) );
  }

  options.supported_languages.forEach( function( lang ) {
    var locale = localeFrom( lang ),
      localePath = resolveLocalePath( locale );

    try {
      locales[ locale ] = plist.parseFileSync( localePath );
console.log(locale, locales[ locale ]);
    } catch( err ) {
      if ( options.default_lang === lang ||
           options.debug_lang === lang ) {
         return;
      }

      var msg = util.format(
        'Locale Error [%s]: missing messages.plist file in [%s]. See locale/README (%s)',
        locale, localePath, err
      );
      if ( !options.disable_locale_check ) {
        logger.warn( msg );
      } else {
        logger.error( msg );
        throw msg;
      }
    }
  });

  function checkUrlLocale( req ) {
    // Look for /en/ or /en-US/ or /en_US/ on the URL
    var matches = req.url.match( /\/([a-zA-Z]{2}([-_][a-zA-Z]{2})?)(\/|$)/ );

    // Swap out the accept-language so that we respect what the user
    // used on the URL, and strip the extra locale info from the URL
    // so our routes still work.
    if ( matches ) {
console.log('here');
      req.url = req.url.replace( matches[ 0 ], '' );
      // Normalize use of dash to underscore internally
      req.headers[ 'accept-language' ] = matches[ 1 ].replace( '-', '_' );
    }
  }

  return function( req, res, next ) {
    if ( options.localeOnUrl ) {
      checkUrlLocale( req );
    }

    console.log( "[%s, %s]", req.headers[ 'accept-language' ], req.url );

    var langs = parseAcceptLanguage( req.headers[ 'accept-language '] ),
      lang_dir,
      lang = bestLanguage( langs, options.supported_languages,
                           options.default_lang),
      debug_lang = options.debug_lang.toLowerCase(),
      locale,
      locals = {},
      gt;

    if ( lang && lang.toLowerCase && lang.toLowerCase() === debug_lang ) {
      // What? http://www.youtube.com/watch?v=rJLnGjhPT1Q
      lang = DAVID_B_LABYRN;
    }

    // Express 2 support
    if ( !!res.local ) {
      res.locals = function( args, orValue ) {
        if ( 'string' === typeof args ) {
          res.local( args, orValue );
        } else {
          Object.keys( args ).forEach( function( key ) {
            res.local( key, args[ key ] );
          });
        }
      };
    }

    locals.lang = lang;

    // BIDI support, which direction does text flow?
    lang_dir = BIDI_RTL_LANGS.indexOf( lang ) >= 0 ? 'rtl' : 'ltr';
    locals.lang_dir = lang_dir;
    req.lang = lang;

    locale = localeFrom( lang );

    locals.locale = locale;
    req.locale = locale;

    locals.format = format;
    req.format = format;

    if ( lang.toLowerCase() === DAVID_B_LABYRN.toLowerCase() ) {
      gt = gobbledygook;
      locals.lang = DAVID_B_LABYRN;
    } else if ( locales[ locale ] ) {
      gt = function( sid ) {
        if ( locales[ locale ][ sid ] && locales[ locale ][ sid ].length ) {
          sid = locales[locale][sid];
        }
        return sid;
      };
    } else {
      // default lang in a non gettext environment... fake it
      gt = function( a, b ) {
        return a;
      };
    }
    locals[ options.gettext_alias ] = gt;
    req.gettext = gt;

    // res.locals(string, value) doesn't seem to work with EJS
    res.locals( locals );

    next();
  };
};

function qualityCmp( a, b ) {
  if ( a.quality === b.quality ) {
    return 0;
  }
  if ( a.quality < b.quality ) {
    return 1;
  }
  return -1;
}

/**
 * Parses the HTTP accept-language header and returns a
 * sorted array of objects. Example object:
 * {
 *   lang: 'pl', quality: 0.7
 * }
 */
module.exports.parseAcceptLanguage = parseAcceptLanguage = function(header) {
  // pl,fr-FR;q=0.3,en-US;q=0.1
  if ( !header || !header.split ) {
    return [];
  }
  var raw_langs = header.split( ',' ),
    langs = raw_langs.map( function( raw_lang) {
      parts = raw_lang.split( ';' );
      var q = 1,
          parts0 = parts[ 0 ],
          parts1 = parts[ 1 ];

      if ( parts.length > 1 && parts1.indexOf( 'q=' ) === 0 ) {
        var qval = parseFloat( parts1.split( '=' )[ 1 ]);
        if ( isNaN(qval) === false ) {
          q = qval;
        }
      }
      return { lang: parts0.trim(), quality: q };
    });
  langs.sort( qualityCmp );
  return langs;
};


 // Given the user's prefered languages and a list of currently
 // supported languages, returns the best match or a default language.
 //
 // languages must be a sorted list, the first match is returned.
module.exports.bestLanguage = bestLanguage = function( languages, supported_languages, defaultLanguage ) {
  var lower = supported_languages.map( function( l ) {
    return l.toLowerCase();
  });
  for( var i = 0; i < languages.length; i++ ) {
    var lq = languages[i];
    if ( lower.indexOf( lq.lang.toLowerCase() ) !== -1 ) {
      return lq.lang;
    // Issue#1128 match locale, even if region isn't supported
    } else if ( lower.indexOf( lq.lang.split( '-' )[ 0 ].toLowerCase() ) !== -1 ) {
      return lq.lang.split( '-' )[ 0 ];
    }
  }
  return defaultLanguage;
};

/**
 * Given a language code, return a locale code the OS understands.
 *
 * language: en-US
 * locale:   en_US
 */
module.exports.localeFrom = localeFrom = function( language ) {
  if ( !language || !language.split) {
    return '';
  }
  var parts = language.split( '-' );
  if ( parts.length === 1 ) {
    return parts[ 0 ].toLowerCase();
  } else if (parts.length === 2) {
    return util.format('%s_%s', parts[ 0 ].toLowerCase(), parts[ 1 ].toUpperCase() );
  } else if (parts.length === 3) {
    // sr-Cyrl-RS should be sr_RS
    return util.format('%s_%s', parts[ 0 ].toLowerCase(), parts[ 2 ].toUpperCase() );
  } else {
    logger.error(
      util.format('Unable to map a local from language code [%s]', language ) );
    return language;
  }
};

/**
 * Given a locale code, return a language code
 */
module.exports.languageFrom = function( locale ) {
  if ( !locale || !locale.split ) {
    return '';
  }
  var parts = locale.split( '_' );
  if ( parts.length === 1 ) {
    return parts[ 0 ].toLowerCase();
  } else if ( parts.length === 2 ) {
    return util.format( '%s-%s', parts[ 0 ].toLowerCase(), parts[ 1 ].toUpperCase() );
  } else if ( parts.length === 3 ) {
    // sr_RS should be sr-RS
    return util.format( '%s-%s', parts[ 0 ].toLowerCase(), parts[ 2 ].toUpperCase() );
  } else {
    logger.error(
      util.format( 'Unable to map a language from locale code [%s]', locale ) );
    return locale;
  }
};

/**
 * format provides string interpolation on the client and server side.
 * It can be used with either an object for named variables, or an array
 * of values for positional replacement.
 *
 * Named Example:
 * format('%(salutation)s %(place)s', {salutation: 'Hello', place: 'World'}, true);
 * Positional Example:
 * format('%s %s', ['Hello', 'World']);
 */
module.exports.format = format = function(fmt, obj, named) {
  if ( !fmt ) {
    return '';
  }
  if ( Array.isArray( obj ) || named === false ) {
    return fmt.replace( /%s/g, function() {
      return String( obj.shift() );
    });
  } else if ( typeof obj === 'object' || named === true ) {
    return fmt.replace( /%\(\s*([^)]+)\s*\)s/g, function( m, v ) {
      return String( obj[ v.trim() ] );
    });
  } else {
    return fmt;
  }
};
