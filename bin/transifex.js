const BASE_URL = 'https://www.transifex.com/api/2/project/';
const DEFAULT_DIR = 'locale';
const DEFAULT_PROJECT = 'amore';
            
var request = require('request'),
  fs = require('fs'),
  path = require('path'),
  mkpath = require('mkpath');

function importFromTransifex(options) {
  var authHeader = 'Basic ' + new Buffer(options.user).toString('base64');

  function writeFile( relPath, exports, callback ) {
    callback = callback || function(){};
    var absPath = path.join(options.dir, relPath);
    mkpath(path.dirname(absPath), function( err ) {
      if ( err ) {
        return callback( err );
      }
      fs.writeFile(absPath, exports, { encoding: "utf-8" }, function( err ) {
        if ( err ) {
          return callback( err );
        }
        callback();
      });
    });
  }

  function projectRequest (url, callback) {
    request.get({
      url: url,
      headers: {'Authorization': authHeader}
    }, function(error, response, body) {
      if (error) {
        callback(error);
      }
      if (response.statusCode !== 200) {
        callback(Error(url + " returned " + response.statusCode));
      }
      callback(null, body);
    });
  };

  var detailsPath = '/?details',
    url = BASE_URL + options.project + detailsPath;
  projectRequest(url, function(error, projectDetails) {
    if (error) {
      return console.log("Can not return the project details");
    }
    var resources = JSON.parse(projectDetails);
    resources.teams.forEach(function(entry) {
      resourcesPath = resources.resources[0].slug + '/translation/' + entry;
      var url = BASE_URL + options.project + '/resource/' + resourcesPath + '/?file';
      projectRequest(url, function(error, fileContent){
        if (error) {
          return console.log("Can not return the fileContent");
        }
        writeFile(path.join(entry, resources.resources[0].slug + '.plist'), fileContent);
      });
    });
  });
}

function main() {
  var program = require('commander');
  program
    .option('-u, --user <user:pass>', 'specify a Transifex username and password in the form username:password')
    .option('-p, --project <slug>', 'specify project slug')
    .option('-d, --dir <path>', 'locale dir for the downloaded plist files')
    .parse(process.argv);
  if (!program.user) {
    console.log('please specify credentials with "-u user:pass".');
    process.exit(1);
  }
  program.project = program.project || DEFAULT_PROJECT;
  program.dir = program.dir || DEFAULT_DIR;
  importFromTransifex(program);
}

if (!module.parent) { 
  main();
}
