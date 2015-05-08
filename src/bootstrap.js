var readService = require('./read-service');
var constants = require('./constants');
var utils = require('./utils');
var logger = require('./logger');

/* Read and Load Files
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var bootstrap = {};

bootstrap.setup = function(successCallback, errorCallback) {
  this.successCallback = successCallback;
  this.errorCallback = errorCallback;
};

bootstrap.init = function(version) {
  var files = [
    version + '_' + constants.JS_FILE_NAME,
    version + '_' + constants.CSS_FILE_NAME
  ];

  readService.setup(injectAllFiles, errorReadingFiles);
  readService.readUrls(files);
};

bootstrap.injectFile = function(filename, filetype) {
  // Create script tag for JS file
  if (filetype === 'JS') {

    var fileref = document.createElement('script')
    fileref.setAttribute('type', 'text/javascript')
    fileref.setAttribute('src', filename)

  } else if (filetype === 'CSS') {

    // Create stylesheet tag for CSS file
    var fileref = document.createElement('link')
    fileref.setAttribute('rel', 'stylesheet')
    fileref.setAttribute('type', 'text/css')
    fileref.setAttribute('href', filename)

  }

  // Attach the tag to the head
  if (typeof fileref !== 'undefined') {
    document.getElementsByTagName('head')[0].appendChild(fileref);
  }
};

function injectAllFiles(files) {
  logger('files', files);
  for (var i = 0; i < files.length; i++) {
    var fileEntry = files[i].fileEntry;
    if (utils.isJsFile(fileEntry.nativeURL)) {
      bootstrap.injectFile(fileEntry.nativeURL, 'JS');
    } else {
      bootstrap.injectFile(fileEntry.nativeURL, 'CSS');
    }
  }

  setTimeout(bootstrap.successCallback, 500);
};

function errorReadingFiles(error) {
  logger(error);
  bootstrap.errorCallback();
};


module.exports = bootstrap;
