var version = require('./version');
var bootstrap = require('./bootstrap');
var logger = require('./logger');
var downloadService = require('./download-service');

/* Cordwood
–––––––––––––––––––––––––––––––––––––––––––––––––– */
function Cordwood(options) {
  var versionUrl = options.versionUrl;
  var files = [options.javascriptUrl, options.cssUrl];
  var currentVersion = options.currentVersion;
  var successCallback = options.successCallback;
  var errorCallback = options.errorCallback;

  (function setup() {

    // Setup the callbacks for bootstrapping
    bootstrap.setup(successCallback, errorCallback);
    // If a current version is not available
    if (version.getCurrent() === undefined) {
      version.setCurrent(currentVersion);
    }

    // Fetch the latest version number
    version.fetchLatestVersion(versionUrl, function() {
      if (version.didUpdate()) {
        logger('version changed calling api to download files');
        downloadUpdatedApp(files, version.getUpdated());
      } else {
        logger('version did not change loading version: %s', version.getCurrent());
        bootstrap.init(version.getCurrent());
      }
    });
  })();


  function downloadUpdatedApp(files, version) {
    logger('new version is %s', version);
    downloadService.setup(allFilesDownloaded, errorWhileDownloading, version);
    downloadService.downloadUrls(files);
  };

  function allFilesDownloaded(files) {
    version.setCurrent(version.getUpdated())
    bootstrap.init(version.getCurrent());
  };

  function errorWhileDownloading(error) {
    logger(error);
    init();
  };
};

window.Cordwood = Cordwood;
