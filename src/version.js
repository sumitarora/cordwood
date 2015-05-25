var downloadService = require('./download-service');
var bootstrap = require('./bootstrap');
var logger = require('./logger');

/* Version Check
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var version = {};

/**
 * Retrieve the version of code to use from the specified URL.
 * This will set the updated version. If successful, using the version that was
 * retrieved; and if there was a problem, using the version that is currently
 * being used.
 * The callback will be called for both success and failure outcomes.
 * @param versionUrl : The URL where the version can be retrieved.
 * @param callback : The callback for when the version request completes.
 **/
version.fetchLatestVersion = function(versionUrl, callback) {
  logger('fetching new version from %s', versionUrl);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', (versionUrl + '?' + (new Date()).getTime()), true);
  xhr.responseType = 'json';
  xhr.timeout = 4000;

  xhr.ontimeout = function() {
    logger('unable to check version Timed out');
    callback();
    version.setUpdated(version.getCurrent());
  };

  xhr.onerror = function(e) {
    logger('unable to check version', e);
    callback();
    version.setUpdated(version.getCurrent());
  };

  xhr.onreadystatechange = function(e) {
    if (this.readyState == 4 && this.status == 200) {
      version.setUpdated(this.response.version);
      callback();
    }
  };

  xhr.send();

  // Make the xhr object available to unit tests.
  return xhr;
};

/**
 * Helper for checking whether the version as requested from the server matches
 * the current version of the code.
 **/
version.didUpdate = function() {
  return version.getUpdated() !== version.getCurrent();
};

/**
 * Getter/setter for the version of the code currently installed.
 **/
version.setCurrent = function(value) {
  localStorage.CURRENT_VERSION = value;
};
version.getCurrent = function() {
  return localStorage.CURRENT_VERSION;
};

/**
 * Getter/setter for the version of the code reported by the version URL.
 **/
version.setUpdated = function(value) {
  version.updated = value;
};
version.getUpdated = function() {
  return version.updated;
};


module.exports = version;
