amore.webmaker.org
==================

A simple example app for Webmaker localization (l10n).

##Instructions

In order to see this web app working, do the following:

```
$ npm install
$ node app.js
```

Now you can see server-side localization in node.js by going to:

* [http://localhost:3000/](http://localhost:3000/)
* [http://localhost:3000/en-US/](http://localhost:3000/en-US/)
* [http://localhost:3000/de/](http://localhost:3000/de/)
* [http://localhost:3000/es/](http://localhost:3000/es/)
* [http://localhost:3000/db_LB/](http://localhost:3000/db_LB/)

You can also try a mix of client-side and server-side using Require.js and the text plugin:

* [http://localhost:3000/static/require-example.html](http://localhost:3000/static/require-example.html)

##Discussion

Localizing strings in Webmaker is a P1 goal for summer 2013. Our community has long called for the
ability to localize our tools, sites, and content. Some initial experiments have been done already, but
none that were able to a) ship or b) deal with all the different types of strings we have.

Webmaker is made up of many node.js web apps, node.js modules, HTML, CSS, JavaScript and some python,
all of which lives across 15 or so repositories.  Currently the strings are spread across both server-side
and client-side code, in HTML and script.  In order to deal with the complexity of localizing all of
Webmaker, we'll have to change this so that we only have strings in one place: HTML.

The Mozilla Identity team has done some good work on a node.js localization solution, see [i18n-abide](https://github.com/mozilla/i18n-abide).
Their code works by examining the request headers for `accept-language`.  They also use a somewhat complicated .PO->.json
build step, in order to support historical l10n ways of working.

##Proposal

Localizing Webmaker is a multi-step process and includes:

* Create webmaker-i18n based on i18n-abide, but without the use of .po files, and with other tweaks we need
* Move all existing strings into templated HTML using [nunjucks](http://nunjucks.jlongster.com/)
* Rewove all string manipulation code from JS, and use elements instead.  Elements will contain the proper
strings already, since we'll load them from templates directly or with [require.js' text plugin](https://github.com/requirejs/text)
and build dom fragments that we dynamically add to the page
* Create an en-US localization for all of our strings
* Setup and use [Transifex](https://www.transifex.com/) for all of Webmaker
* Create necessary tooling/processes for getting localized files back into our repos

##Transifex

Transifex is what Github is to git, that is, an online platform offering tooling and community for localizers and
projects wanting localization.  It is free for open source projects, and has been used with success already in
a number of Mozilla localization projects.

Having spoken with Transifex about best practices, it seems that Webmaker would create a single project and then
upload many files (resources) under that project.  In the simplest case, this would mean one file per repository,
but could mean one or more files per repository.

Transifex has "string memory" so that a string `foo` in one resource would be automatically translated in another--
splitting our strings across many files/resources wouldn't add more work for our localizers.

###Property Lists (plist)

Transifex supports many [file formats](http://help.transifex.com/features/formats.html), among them .po, .ini, .xml, etc.
Webmaker has no historical localization community, tooling, or data, so deciding how we want to do this is wide open.
In speaking with Transifex, most translators use the online tools vs. doing it with local toolchains, and as such,
providing support for formats that we don't actually want to consume directly, and which would require extra build steps,
is undesirable.

Node.js and Transifex both support .plist files, which are what was created for OS X and iPhone apps.  These are
simple XML files, and for the purposes of localizaiton, contain key/value pairs in a dictionary.  Below is an example:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>iloveyou</key>
    <string>I love you</string>
  </dict>
</plist>
```

Whatever we end-up choosing, the goal is for our translators and tools to never work with it directly, and to 
avoid the need for format build steps to alter it from one thing to another: let's choose something and use it.

We've asked Transifex for advice on whether plist is going to be an issue down the road, and are waiting to hear back.
Since node.js can consume .plist directly, translating our strings to .json or some other format later is also possible.

##locale/* files

The .plist files from Transifex are named using the pattern `<lang>.plist`, for example: `de.plist` or `en_US.plist`.
When the node app starts, it begins by reading all the locale files specified in the i18n middleware setup.  One
of these locales is also set as the default.

For experimentation purposes, we have added code to inspect incoming URLs for locale info, and override the
accpet-language.  For example:

* localhost:3000/ --> will use `accept-language` header
* localhost:3000/de/ --> will use the de locale and ignore `accept-language`

##Templates

Strings in the locale files are used via templates.  The i18n module adds 3 things to the global scope which 
templated JS can use, specifically:

```html
<!DOCTYPE html>
<html lang="{{ lang }}" dir="{{ lang_dir }}">
...
<p id="main">{{ gettext( "iloveyou" ) }}</p>
```

Here the `lang` will be the locale's language, for example `en` or `en_US`.  The `lang_dir` variable will be
the direction of the language (`rtl` or `ltr`).  Finally, the `gettext` function allows a string to be retrieved
from the locale using an ID.  The ID used should match one in the `<key>...</key>` portion of the .plist file.

##Using Strings in Require.js

Require.js has its own strategy for localization.  The proposal is to not use it, and keep all strings out of JS
CSS, partly so they compress better, partly so they can be cached better, and partly so that we don't have to
provide multiple string catalogs for node.js and require.js, which each need it done slightly differently.

The strategy we want to use relies instead on a mix of templated strings from node.js and the use of Require.js'
text plugin.  When localized content (probably html) needs to be loaded from the server, Require.js will use
the text plugin to get the data from a node.js route, which will build localized data as outlined above.  Next
we will create a dom fragment in the browser and inject that into the dom.  An example of this technique is available
in `static/require-example.html`.
