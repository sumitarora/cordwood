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
  if (filetype === 'JS') {
    // Create script tag for JS file
    var fileref = document.createElement('script')
    fileref.setAttribute('type', 'text/javascript')
    fileref.setAttribute('src', filename)
  } else if (filetype === 'CSS') {
    // Create stylesheet tag for CSS file
    var fileref = document.createElement('link')
    fileref.setAttribute('rel', 'stylesheet')
    fileref.setAttribute('type', 'text/css')
    fileref.setAttribute('href', filename)
  } else {
    // It shouldn't be the case that something that is neither JS or CSS
    // happens, but if it does, skip out, since there's nothing to add to the
    // DOM.
    return;
  }

  // Attach the tag to the head
  document.getElementsByTagName('head')[0].appendChild(fileref);
};

function injectAllFiles(files) {
  logger('files', files);
  for (var i = 0; i < files.length; i++) {
    var fileEntry = files[i].fileEntry;
    if (utils.hasFileExtension(fileEntry.nativeURL, 'js')) {
      bootstrap.injectFile(fileEntry.nativeURL, 'JS');
    } else if (utils.hasFileExtension(fileEntry.nativeURL, 'css')) {
      bootstrap.injectFile(fileEntry.nativeURL, 'CSS');
    }
  }

  setTimeout(bootstrap.successCallback, 500);
};

function errorReadingFiles(error) {
  logger(error);
  bootstrap.errorCallback();
};

// Expose these methods for unit testing.
bootstrap._injectAllFiles = injectAllFiles;
bootstrap._errorReadingFiles = errorReadingFiles;
module.exports = bootstrap;
