var downloadService = require('./download-service');
var bootstrap = require('./bootstrap');
var logger = require('./logger');

/* Version Check
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var version = {};

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

version.didUpdate = function() {
  return version.getUpdated() !== version.getCurrent();
};

version.setCurrent = function(value) {
  localStorage.CURRENT_VERSION = value;
};

version.getCurrent = function() {
  return localStorage.CURRENT_VERSION;
};

version.setUpdated = function(value) {
  version.updated = value;
};

version.getUpdated = function() {
  return version.updated;
};


module.exports = version;
