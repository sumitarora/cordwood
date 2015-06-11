(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
/* Asset Service
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var assetService = {
  'setup': setup
};

var constants = require('./constants');

var assetDirectories = [];
var destinationDirectory;

function logger() {
  //noop
}

function makeIterator(fn) {
  return function (list) {
    for (var index in list) {
      if (list.hasOwnProperty(index)) {
        fn(list[index]);
      }
    }
  };
}

function filter(predicateFn) {
  return function curriedFilter(list) {
    for (var index = list.length; index > -1; index -= 1) {
      if (list.hasOwnProperty(index) && !predicateFn(list[index])) {
        list.splice(index, 1);
      }
    }
    return list;
  };
}

function makeDirectoryCreator(root) {
  return function (directoryPath) {
    logger(directoryPath);
    var directoryNames = directoryPath.split('/');
    directoryNames = filter(function (directoryName) {
      return directoryName !== '';
    })(directoryNames);
    if (directoryNames.length === 0) {
      return;
    } else if (directoryNames.length > 0) {
      logger('directoryNames before shift:', directoryNames);
      var thisDirectory = directoryNames.shift(1);
      logger('directoryNames after shift:', directoryNames);
      root.getDirectory(
        thisDirectory, {
          'create': true
        },
        function recurseDirectoryCreator(newRoot) {
          logger('directoryNames in callback:', directoryNames);
          logger('Calling makeDirectoryCreator again with ' +
            directoryNames.join('/'));
          makeDirectoryCreator(newRoot)(directoryNames.join('/'));
        },
        function () {
          throw new Error(['Couldn\'t create nested directory',
            directoryPath
          ].join(' '));
        });
    } else {
      logger(directoryNames);
      throw new Error('This should never happen');
    }
  };
}

/**
 * setup
 *
 * @param {string|string[]} src directory to copy
 * @param {string} dest destination (optional)
 */
function setup(src, dest) {
  destinationDirectory = dest || cordova.file.dataDirectory;
  src = src || constants.DEFAULT_ASSET_DIRECTORIES;
  if (typeof src === 'string') {
    src = [src];
  }
  makeIterator(function (path) {
    assetDirectories.push(path);
  })(src);
  logger('setup running');
  resolveLocalFileSystemURL(destinationDirectory, function (dataDirectory) {
    makeDirectoryCreator(dataDirectory)(constants.CSS_DIRECTORY);
  });
  copyAssets();
}

/**
 * makeErrorThrower(src, dest)
 * @param {FileError} error
 */
function makeErrorThrower(src, dest) {
  src = src.name || src;
  dest = dest.name || dest;
  return function throwError(error) {
    throw new Error(['At', src, 'to', dest, error].join(' '));
  };
}

function makeChildGetter(dirEntry) {
  return function getChildCurried(childName, options, successCallback) {
    dirEntry.getFile(childName, null, successCallback,
      onTypeMismatchError(function () {
        dirEntry.getDirectory(childName, null, successCallback, function (
          error) {
          throw new Error('Error code ' + error.code +
            'Couldn\'t get child: ' + childName);
        });
      }));
  };
}

/**
 * copyDirectory
 *
 * @param {DirectoryEntry} src
 * @param {DirectoryEntry} dest
 */
function copyDirectory(src, dest) {
  logger(['copying directory', src, 'into', dest].join(' '));
  src.createReader().readEntries(function (entries) {
    makeIterator(function (entry) {
      var name = entry.name;
      logger('name: ' + name);
      if (entry.isFile === true) {
        dest.getFile(name, {
          'create': true
        }, makeEntryCopierFn(entry));
      } else if (entry.isDirectory === true) {
        dest.getDirectory(name, {
          'create': true
        }, makeEntryCopierFn(entry));
      } else {
        throw new Error('Neither file nor directory');
      }
      makeChildGetter(dest)(name, makeEntryCopierFn(entry));
    })(entries);
  }, makeErrorThrower(src, dest));
}

/**
 * copyEntry
 *
 * @param {string|FileEntry|DirectoryEntry} src
 * @param {string|FileEntry|DirectoryEntry} dest
 */
function copyEntry(src, dest) {
  logger(['copying entry', src, 'into', dest].join(' '));
  if (typeof src === 'string') {
    return resolveLocalFileSystemURL(src, function (newSrc) {
        copyEntry(newSrc, dest);
      },
      makeErrorThrower(src, dest));
  } else if (typeof dest === 'string') {
    return resolveLocalFileSystemURL(dest, function (newDest) {
        copyEntry(src, newDest);
      },
      makeErrorThrower(src, dest));
  } else {
    if (src.isDirectory) {
      copyDirectory(src, dest);
    } else if (src.isFile) {
      copyFile(src, dest);
    } else {
      throw new Error('Entry is neither a directory nor a file');
    }
  }
}

function makeEntryCopierFn(src) {
  return function curriedCopyEntry(dest) {
    return copyEntry(src, dest);
  };
}

function copyAssets() {
  makeIterator(function (dir) {
    logger(dir);
    resolveLocalFileSystemURL(
      cordova.file.applicationDirectory + dir,
      function (src) {
        resolveLocalFileSystemURL(destinationDirectory, function (
          destParent) {
          destParent.getDirectory(dir, {
              'create': true
            },
            makeEntryCopierFn(src),
            makeErrorThrower(src, dir));
        });
      },
      function (error) {
        throw new Error(error);
      });
  })(assetDirectories);
}

function onTypeMismatchError(fn) {
  return function onTypeMismatchCurried(error) {
    /*eslint-disable eqeqeq */
    if (error.code == FileError.TYPE_MISMATCH_ERR) {
      /*eslint-enable eqeqeq */
      return fn();
    } else {
      throw new Error('Error: ' + error.code);
    }
  };
}

/**
 * makeWriter
 *
 * @param {FileEntry} dest
 */
function makeWriter(dest) {
  return function (data) {
    dest.createWriter(
      function (writer) {
        logger('we\'re writing: ', data.target.result);
        return writer.write(data.target.result);
      },
      makeErrorThrower(data, dest)
    );
  };
}

/**
 * copyFile
 *
 * @param {FileEntry} src
 * @param {FileEntry} dest
 */
function copyFile(src, dest) {
  logger(['copying file', src, 'into', dest].join(' '));

  return src.file(function (srcFile) {
    var reader = new FileReader();
    reader.onloadend = makeWriter(dest);
    logger(['Writing from', src, 'to', dest].join(' '));
    reader.readAsArrayBuffer(srcFile);
  });

}

module.exports = assetService;

},{"./constants":3}],2:[function(require,module,exports){
'use strict';
var readService = require('./read-service');
var constants = require('./constants');
var utils = require('./utils');
var logger = require('./logger');

/* Read and Load Files
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var bootstrap = {};

/**
 * The success/error callbacks are those defined in the options passed to
 * Cordwood.
 * @param successCallback : The callback used once the initialization process
 * has completed. Probably, this would start the angular app that was loaded.
 * @param errorCallback : The callback used if initialization fails. Probably,
 * this would show an error page.
 **/
bootstrap.setup = function (successCallback, errorCallback) {
  this.successCallback = successCallback;
  this.errorCallback = errorCallback;
};

/**
 * Kick off the process of putting the js/css files for a version of the app
 * into the DOM.
 * @param version : The version of the app to load.
 **/
bootstrap.init = function (version) {
  var files = [
    version + '_' + constants.JS_FILE_NAME,
    constants.CSS_DIRECTORY + version + '_' + constants.CSS_FILE_NAME
  ];

  readService.setup(injectAllFiles, errorReadingFiles);
  readService.readFiles(files);
};

/**
 * Given the URL to a resource; if it has a js or css file extension, add a DOM
 * node for that resource to the head of the document.
 * @param url : The native URL for a js or css file to be included in the document.
 **/
bootstrap.injectFile = function (url) {
  if (utils.hasFileExtension(url, 'js')) {
    // Create script tag for JS file
    var fileref = document.createElement('script');
    fileref.setAttribute('type', 'text/javascript');
    fileref.setAttribute('src', url);
  } else if (utils.hasFileExtension(url, 'css')) {
    // Create stylesheet tag for CSS file
    fileref = document.createElement('link');
    fileref.setAttribute('rel', 'stylesheet');
    fileref.setAttribute('type', 'text/css');
    fileref.setAttribute('href', url);
  } else {
    // It shouldn't be the case that something that is neither JS or CSS
    // happens, but if it does, skip out, since there's nothing to add to the
    // DOM.
    return;
  }

  // Attach the tag to the head
  document.getElementsByTagName('head')[0].appendChild(fileref);
};

/**
 * Callback function for handling the injection of files into the DOM. This
 * callback is invoked when the read service has successfully read all of the
 * files; and once this callback completes, the overall success callback is
 * invoked.
 * @param files : The list of file items to be injected.
 **/
function injectAllFiles(files) {
  logger('files', files);
  for (var i = 0; i < files.length; i++) {
    var fileEntry = files[i].fileEntry;
    bootstrap.injectFile(fileEntry.nativeURL);
  }

  setTimeout(bootstrap.successCallback, 500);
}

/**
 * The callback used by the read service if there was a problem reading the
 * files.
 **/
function errorReadingFiles(error) {
  logger(error);
  bootstrap.errorCallback();
}

// Expose these methods for unit testing.
bootstrap._injectAllFiles = injectAllFiles;
bootstrap._errorReadingFiles = errorReadingFiles;
module.exports = bootstrap;

},{"./constants":3,"./logger":6,"./read-service":7,"./utils":11}],3:[function(require,module,exports){
'use strict';
/* Constants
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var constants = {
  JS_FILE_NAME: 'app.js',
  CSS_DIRECTORY: 'www/css/',
  CSS_FILE_NAME: 'app.css',
  DEFAULT_ASSET_DIRECTORIES: ['www/img', 'www/fonts'],
  LATEST_VERSION_URL: 'version.json',
  MASTER_PATH: '/branch/master',
  ALL_VERSIONS_URL: '/versions.json',
  DEBUG: false
};


module.exports = constants;

},{}],4:[function(require,module,exports){
'use strict';
var constants = require('./constants');
var utils = require('./utils');
var logger = require('./logger');

/* Download Service
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var downloadService = {};

var downloadsQueue = [];
var downloadedQueue = [];

/**
 * Initialize the download service with the callbacks defined in cordwood.js
 **/
downloadService.setup = function (successCallback, errorCallback,
  versionToFetch) {
  this.versionToFetch = versionToFetch;
  this.successCallback = successCallback;
  this.errorCallback = errorCallback;

  // Ensure these are empty at setup time - this acts as unit test cleanup.
  downloadsQueue = [];
  downloadedQueue = [];

  logger('version being fetched by download: ', versionToFetch);
};

/**
 * Entry point for downloading JS/CSS files from a server.
 * @param urls - The URLs to retrieve. This can be either a string with one URL,
 * or an array with multiple filenames.
 **/
downloadService.downloadUrls = function (urls) {
  if (typeof urls === 'string') {
    downloadsQueue.push(urls);
  } else if (urls && urls.constructor === Array) {
    downloadsQueue = urls;
  } else {
    throw 'Url\'s must be String or Array';
  }

  logger('downloadsQueue:', downloadsQueue);
  startDownload();
};

/**
 * Helper to trigger the read process for the set of URLs.
 **/
function startDownload() {
  logger('start download');
  for (var i = 0; i < downloadsQueue.length; i++) {
    downloadFile(downloadsQueue[i]);
  }
}

/**
 * Helper for establishing which callback function should be called once all of
 * the URLs have been downloaded.
 **/
function checkAllFilesDownloaded() {
  logger('check', downloadedQueue);
  if (downloadedQueue.length === downloadsQueue.length) {
    var allDownloded = true;
    for (var i = 0; i < downloadedQueue.length; i++) {
      if (!downloadedQueue[i].downloaded) {
        allDownloded = false;
        break;
      }
    }
    if (allDownloded) {
      downloadService.successCallback(downloadedQueue);
    } else {
      downloadService.errorCallback('Unable to download all files');
    }
  }
}

/**
 * Helper for taking an URL, downloading it, and writing its contents to the
 * cordova data directory.
 * A record will be added to downloadedQueue with the following properties
 * `url` : The URL that was being downloaded.
 * `downloaded` : A boolean flag for whether it was successfully downloaded.
 * `fileUrl` : When successful, the associated local fileEntry for the URL.
 * @param url - The URL to download.
 **/
function downloadFile(url) {
  var destinationDir = cordova.file.dataDirectory;
  var filename = downloadService.versionToFetch + '_';
  if (utils.hasFileExtension(url, 'js')) {
    filename = filename + constants.JS_FILE_NAME;
  } else if (utils.hasFileExtension(url, 'css')) {
    filename = filename + constants.CSS_FILE_NAME;
    destinationDir = destinationDir + constants.CSS_DIRECTORY;
  } else {
    // I don't think this should be able to occur.
    downloadService.errorCallback('Encountered unexpected filetype', url);
  }

  function fileDownloadSuccess(data) {
    downloadedQueue.push({
      url: url,
      fileUrl: data,
      downloaded: true
    });
    checkAllFilesDownloaded();
  }

  function fileDownloadError(error) {
    logger(error);
    downloadedQueue.push({
      url: url,
      downloaded: false
    });
    checkAllFilesDownloaded();
  }

  window.resolveLocalFileSystemURL(
    destinationDir,
    function (directory) {
      directory.getFile(
        filename, {
          create: true,
          exclusive: false
        },
        /**
         * If the version-specific file to write to was created successfully,
         * then download the url into it.
         * @param fileEntry - The file entry for the local file to be written
         * to.
         **/
        function gotFileEntry(fileEntry) {
          var fileTransfer = new FileTransfer();
          fileEntry.remove();
          fileTransfer.download(
            url,
            fileEntry.nativeURL,
            fileDownloadSuccess,
            fileDownloadError
          );
        },
        fileDownloadError
      );
    },
    fileDownloadError);
}


module.exports = downloadService;

},{"./constants":3,"./logger":6,"./utils":11}],5:[function(require,module,exports){
'use strict';
var bootstrap = require('./bootstrap');
var assetService = require('./asset-service');
var downloadService = require('./download-service');
var logger = require('./logger');
var ui = require('./ui');
var urls = require('./urls');
var version = require('./version');

/* Cordwood
–––––––––––––––––––––––––––––––––––––––––––––––––– */
function Cordwood(options) {
  urls.setBase(options.baseUrl);
  urls.initForMaster();
  var currentVersion = options.currentVersion;
  var successCallback = options.successCallback;
  var errorCallback = options.errorCallback;
  var multipleVersions = options.multipleVersions || false;
  var assetDirectories = options.assetDirectories;

  (function setup() {

    assetService.setup(assetDirectories);

    // Setup the callbacks for bootstrapping the app
    bootstrap.setup(successCallback, errorCallback);
    // If a current version is not available
    if (version.getCurrent() === undefined) {
      version.setCurrent(currentVersion);
    }

    if (multipleVersions) {
      // Fetch all available versions
      version.fetchAllVersions(urls.allVersions, onFetchAllVersions, function () {
        // If Fetch all versions fails then default to refreshing master
        version.fetchLatestVersion(urls.latestVersion,
          onFetchLatestVersion);
      });
    } else {
      // Fetch the latest version number and respond accordingly
      version.fetchLatestVersion(urls.latestVersion, onFetchLatestVersion);
    }

  })();

  /**
   * Download the specified JS/CSS urls as the specified version of the app.
   * @param _urls The URLs for the JavaScript and CSS for the application
   * @param _version A version number.
   **/
  function downloadUpdatedApp(_urls, _version) {
    logger('new _version is %s', _version);
    downloadService.setup(allFilesDownloaded, errorWhileDownloading, _version);
    downloadService.downloadUrls(_urls);
  }

  /**
   * Callback for once all of the files have been downloaded.
   * Uses the bootstrap to add the files to the DOM.
   **/
  function allFilesDownloaded() {
    version.setCurrent(version.getUpdated());
    bootstrap.init(version.getCurrent());
  }

  /**
   * Error callback for when file download fails.
   */
  function errorWhileDownloading(error) {
    logger(error);
    bootstrap.init(version.getCurrent());
  }

  /**
   * This function checks to see if the version updated or not.
   * If it did it will initiate download of the new version.
   * Otherwise it will bootstrap using the existing version
   */
  function onFetchLatestVersion() {
    if (version.didUpdate()) {
      logger('version changed calling api to download files');
      downloadUpdatedApp(urls.files, version.getUpdated());
    } else {
      logger('version did not change loading version: %s', version.getCurrent());
      bootstrap.init(version.getCurrent());
    }
  }

  /**
   * Success callback for fetching all versions.
   */
  function onFetchAllVersions(versions) {
    ui.init(versions, function (url) {
      ui.teardown();
      version.fetchLatestVersion(url, onFetchLatestVersion);
    });
  }
}

window.Cordwood = Cordwood;

},{"./asset-service":1,"./bootstrap":2,"./download-service":4,"./logger":6,"./ui":9,"./urls":10,"./version":12}],6:[function(require,module,exports){
'use strict';
var constants = require('./constants');

/* Logger
–––––––––––––––––––––––––––––––––––––––––––––––––– */
/**
 * Log a message by passing the arguments through to console.info when in debug
 * mode.
 **/
var logger = function () {
  if (constants.DEBUG) {
    console.info.apply(this, arguments);
  }
};

module.exports = logger;

},{"./constants":3}],7:[function(require,module,exports){
'use strict';
var logger = require('./logger');

/* Read Service
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var readService = {};

var readQueue = [];
var loadedFiles = [];

/**
 * Initialize the read service with the callback functions from the bootstrap.
 **/
readService.setup = function (successCallback, errorCallback) {
  this.successCallback = successCallback;
  this.errorCallback = errorCallback;

  // Ensure these are empty at setup time - this acts as unit test cleanup.
  readQueue = [];
  loadedFiles = [];
};

/**
 * Entry point for reading a set of files from the data directory.
 * @param filenames The filenames to read. This can be either a string with
 * one filename, or an array with multiple file names.
 **/
readService.readFiles = function (filenames) {
  if (typeof filenames === 'string') {
    readQueue.push(filenames);
  } else if (filenames && filenames.constructor === Array) {
    readQueue = filenames;
  } else {
    throw 'File name\'s must be String or Array';
  }

  logger('readQueue:', readQueue);
  startReading();
};

/**
 * Helper to trigger the read process for the set of files.
 **/
function startReading() {
  logger('start reading');
  for (var i = 0; i < readQueue.length; i++) {
    readFile(readQueue[i]);
  }
}

/**
 * Helper for establishing which callback function should be called once all of
 * the files have been read.
 **/
function checkAllFilesRead() {
  logger('check', loadedFiles);
  if (readQueue.length === loadedFiles.length) {
    var allRead = true;
    for (var i = 0; i < loadedFiles.length; i++) {
      if (!loadedFiles[i].read) {
        allRead = false;
        break;
      }
    }
    if (allRead) {
      readService.successCallback(loadedFiles);
    } else {
      readService.errorCallback('Unable to read all files');
    }
  }
}

/**
 * Attempt to read the provided filename from the cordova data directory.
 * A record will be added to loadedFiles with the following properties
 * `filename` : The filename that was being read.
 * `read` : A boolean flag for whether it was successfully read.
 * `fileEntry` : When successful, the associated fileEntry for the filename.
 * @param filename : The name of the file to read.
 **/
function readFile(filename) {
  logger(cordova.file.dataDirectory, filename);

  window.resolveLocalFileSystemURL(
    cordova.file.dataDirectory + filename,
    readFileSuccess,
    readFileError
  );

  function readFileSuccess(fileEntry) {
    logger(fileEntry.nativeURL);
    loadedFiles.push({
      filename: filename,
      fileEntry: fileEntry,
      read: true
    });
    checkAllFilesRead();
  }

  function readFileError(e) {
    logger(e);
    loadedFiles.push({
      filename: filename,
      read: false
    });
    checkAllFilesRead();
  }
}

module.exports = readService;

},{"./logger":6}],8:[function(require,module,exports){
'use strict';
var utils = require('./utils');

/* Styles
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var styles = {};

styles.jsonCSS = {
  body: {
    color: '#607D8B',
    fontFamily: 'sans-serif',
    margin: 0
  },

  header: {
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    left: 0,
    padding: '0 1.5rem',
    position: 'fixed',
    margin: 0,
    top: 0,
    width: '100%'
  },

  h1: {
    height: '5rem',
    lineHeight: '5rem',
    margin: 0
  },

  ul: {
    listStyle: 'none',
    margin: '5.5rem 0 0 0',
    padding: 0
  },

  li: {
    backgroundColor: '#ECF8FE',
    border: '1px solid #a3ddfa',
    borderRadius: '4px',
    height: '5rem',
    lineHeight: '5rem',
    margin: '0.5rem',
    padding: '0 1rem'
  },

  'li:active,li:focus': {
    backgroundColor: '#ccecfc'
  }
};

// Converts JSON into CSS
// the type passed in is used as the selector
// eg: if type is a:hover, a:list
// the final result will be: a:hover, a:list { … }
styles.getByType = function (type) {
  if (type !== 'get' && type in styles.jsonCSS) {
    var styleObj = styles.jsonCSS[type];
    var styleStr = type + ' { ';

    var keys = Object.keys(styleObj);

    for (var i = 0; i < keys.length; i++) {
      styleStr += utils.toSnakeCase(keys[i]) + ': ' +
        String(styleObj[keys[i]]) + '; ';
    }
    return styleStr + '}';
  }
};

// Generates a CSS string that can be used in a
// stylesheet or a style tag
styles.get = function () {
  var keys = Object.keys(styles.jsonCSS);
  var cssString = '';

  for (var i = 0; i < keys.length; i++) {
    cssString += styles.getByType(keys[i]) + ' ';
  }

  return cssString;
};


module.exports = styles;

},{"./utils":11}],9:[function(require,module,exports){
'use strict';
var styles = require('./styles');
var urls = require('./urls');

/* Version Selector UI
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var body, head;

/**
 * Helper to generate text content of the list item
 */
function itemContent(item) {
  return ['<strong>PR#', item.pr, '</strong>', '(', item.branch, ')'].join(' ');
}

/**
 * Helper to generate the <li> DOM node for a list item
 */
function generateListItem(item, clickFn) {
  var listItem = document.createElement('li');
  listItem.innerHTML = itemContent(item);
  listItem.onclick = (function () {
    return function () {
      urls.initForPr(item.path);
      item.latestVersion = urls.latestVersion;
      // make the result available for testing
      return clickFn(item.latestVersion);
    };
  })();

  return listItem;
}

/**
 * Function to generate the list of all available versions
 */
function generateList(versions, clickFn) {
  var list = document.createElement('ul');
  list.id = 'js-ui-list';

  versions.forEach(function (item) {
    list.appendChild(generateListItem(item, clickFn));
  });

  body.appendChild(list);
}

/**
 * Generate the list header
 */
function generateHeader() {
  var header = document.createElement('header');
  header.id = 'js-ui-header';
  var h1 = document.createElement('h1');
  h1.innerHTML = 'Available Versions';

  header.appendChild(h1);
  body.appendChild(header);
}

/**
 * Insert the UI CSS to into a style tag and
 * load it into the page
 */
function attachStyles() {
  var style = document.createElement('style');

  style.type = 'text/css';
  style.id = 'js-ui-styles';
  style.appendChild(document.createTextNode(styles.get()));

  head.appendChild(style);
}

/**
 * Initiate the UI
 */
function init(versions, clickFn) {
  head = document.head;
  body = document.body;

  attachStyles();
  generateHeader();
  generateList(versions, clickFn);
}

/**
 * Delete all the UI DOM nodes and cleanup
 */
function teardown() {
  var header = document.getElementById('js-ui-header');
  var list = document.getElementById('js-ui-list');
  var _styles = document.getElementById('js-ui-styles');

  header.parentNode.removeChild(header);
  list.parentNode.removeChild(list);
  _styles.parentNode.removeChild(_styles);
}


module.exports.init = init;
module.exports.teardown = teardown;

},{"./styles":8,"./urls":10}],10:[function(require,module,exports){
'use strict';
var constants = require('./constants');

/* URLs
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var urls = {};

/**
 * Set the base URL
 * @param baseUrl
 */
urls.setBase = function (baseUrl) {
  urls.base = baseUrl;
};

/**
 * Set the base URL and generate the various URLs required for
 * the master branch.
 */
urls.initForMaster = function () {
  var masterUrl = urls.base + constants.MASTER_PATH + '/';

  urls.files = [
    masterUrl + constants.JS_FILE_NAME,
    masterUrl + constants.CSS_FILE_NAME
  ];

  urls.allVersions = urls.base + constants.ALL_VERSIONS_URL;
  urls.latestVersion = masterUrl + constants.LATEST_VERSION_URL;
};

/**
 * Set the base URL and generate the various URLs required for
 * the PR branch.
 * @param path
 */
urls.initForPr = function (path) {

  var prUrl = urls.base + (path || constants.MASTER_PATH) + '/';

  urls.files = [
    prUrl + constants.JS_FILE_NAME,
    prUrl + constants.CSS_FILE_NAME
  ];

  urls.latestVersion = prUrl + constants.LATEST_VERSION_URL;
};


module.exports = urls;

},{"./constants":3}],11:[function(require,module,exports){
'use strict';
/* Utils
–––––––––––––––––––––––––––––––––––––––––––––––––– */

/**
 * Function for checking if the filename ends with the provided file extension.
 * This function is case insensitive.
 * @param filename : The filename to check
 * @param extension : The extension to check for.
 **/
function hasFileExtension(filename, extension) {
  // Ensure both values are present, otherwise it's not worth comparing.
  if (filename && extension) {
    // Normalize the extension to lowercase, and add the leading `.`
    var fullExtension = '.' + extension.toLowerCase();
    // The position in the filename where the extension begins.
    var index = filename.length - fullExtension.length;

    return filename.toLowerCase().lastIndexOf(fullExtension) === index;
  } else {
    return false;
  }
}

/**
 * Function for converting camel-case strings to snake-case
 * @param str : The string to convert
 **/
var toSnakeCase = function (str) {
  return str.replace(/([A-Z])/g, function (s) {
    return '-' + s.toLowerCase();
  });
};


module.exports.hasFileExtension = hasFileExtension;
module.exports.toSnakeCase = toSnakeCase;

},{}],12:[function(require,module,exports){
'use strict';
var logger = require('./logger');

/* Version Check
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var version = {};

/**
 * Retrieve the list of available versions from the specified URL.
 * If successful, run the callback and pass in the list of versions.
 * @param url : The URL where the versions list can be retrieved.
 * @param successCallback : The callback for when the version
 * request completes.
 * @param errorCallback : The callback for when the version request fails.
 */
version.fetchAllVersions = function (url, successCallback, errorCallback) {
  logger('fetching all available versions from %s', url);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', (url + '?' + new Date().getTime()), true);
  xhr.responseType = 'json';
  xhr.timeout = 4000;

  xhr.ontimeout = function () {
    logger('unable to get all versions; Timed out');
    errorCallback();
  };

  xhr.onerror = function (e) {
    logger('unable to get all versions', e);
    errorCallback();
  };

  xhr.onreadystatechange = function () {
    /*eslint-disable eqeqeq */
    if (this.readyState == 4 && this.status == 200) {
      /*eslint-enable eqeqeq */
      successCallback(this.response.prs);
    }
  };

  xhr.send();

  // Make the xhr object available to unit tests.
  return xhr;
};

/**
 * Retrieve the version of code to use from the specified URL.
 * This will set the updated version. If successful, using the version that was
 * retrieved; and if there was a problem, using the version that is currently
 * being used.
 * The callback will be called for both success and failure outcomes.
 * @param versionUrl : The URL where the version can be retrieved.
 * @param callback : The callback for when the version request completes.
 **/
version.fetchLatestVersion = function (url, callback) {
  logger('fetching new version from %s', url);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', (url + '?' + new Date().getTime()), true);
  xhr.responseType = 'json';
  xhr.timeout = 4000;

  xhr.ontimeout = function () {
    logger('unable to check version Timed out');
    callback();
    version.setUpdated(version.getCurrent());
  };

  xhr.onerror = function (e) {
    logger('unable to check version', e);
    callback();
    version.setUpdated(version.getCurrent());
  };

  xhr.onreadystatechange = function () {
    /*eslint-disable eqeqeq */
    if (this.readyState == 4 && this.status == 200) {
      /*eslint-enable eqeqeq */
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
version.didUpdate = function () {
  return version.getUpdated() !== version.getCurrent();
};

/**
 * Getter/setter for the version of the code currently installed.
 **/
version.setCurrent = function (value) {
  localStorage.CURRENT_VERSION = value;
};
version.getCurrent = function () {
  return localStorage.CURRENT_VERSION;
};

/**
 * Getter/setter for the version of the code reported by the version URL.
 **/
version.setUpdated = function (value) {
  version.updated = value;
};
version.getUpdated = function () {
  return version.updated;
};


module.exports = version;

},{"./logger":6}]},{},[5])