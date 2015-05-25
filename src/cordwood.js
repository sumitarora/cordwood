var version = require('./version');
var bootstrap = require('./bootstrap');
var logger = require('./logger');
var downloadService = require('./download-service');

/* Cordwood
–––––––––––––––––––––––––––––––––––––––––––––––––– */
function Cordwood(options) {
  var versionUrl = options.versionUrl;
  var urls = [options.javascriptUrl, options.cssUrl];
  var currentVersion = options.currentVersion;
  var successCallback = options.successCallback;
  var errorCallback = options.errorCallback;

  (function setup() {

    // Setup the callbacks for bootstrapping the app
    bootstrap.setup(successCallback, errorCallback);
    // If a current version is not available
    if (version.getCurrent() === undefined) {
      version.setCurrent(currentVersion);
    }

    // Fetch the latest version number
    version.fetchLatestVersion(versionUrl, function() {
      if (version.didUpdate()) {
        logger('version changed calling api to download files');
        downloadUpdatedApp(urls, version.getUpdated());
      } else {
        logger('version did not change loading version: %s', version.getCurrent());
        bootstrap.init(version.getCurrent());
      }
    });
  })();

  /**
   * Download the specified JS/CSS urls as the specified version of the app.
   * @param urls : The URLs for the JavaScript and CSS for the application
   * @param version : A version number.
   **/
  function downloadUpdatedApp(urls, version) {
    logger('new version is %s', version);
    downloadService.setup(allFilesDownloaded, errorWhileDownloading, version);
    downloadService.downloadUrls(urls);
  };

  /**
   * Callback for once all of the files have been downloaded. Uses the bootstrap
   * to add the files to the DOM.
   **/
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
