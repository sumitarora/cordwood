var constants = require('./constants');
var utils = require('./utils');
var logger = require('./logger');

/* Download Service
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var downloadService = {};

var downloadsQueue = [];
var downloadedQueue = [];

downloadService.setup = function(successCallback, errorCallback, versionToFetch) {
  this.versionToFetch = versionToFetch;
  this.successCallback = successCallback;
  this.errorCallback = errorCallback;

  // Ensure these are empty at setup time - this acts as unit test cleanup.
  downloadsQueue = [];
  downloadedQueue = [];

  logger('version being fetched by download: ', versionToFetch);
};

downloadService.downloadUrls = function(urls) {
  if (typeof(urls) === 'string') {
    downloadsQueue.push(urls);
  } else if (urls && urls.constructor === Array) {
    downloadsQueue = urls;
  } else {
    throw 'Url\'s must be String or Array';
  }

  logger('downloadsQueue:', downloadsQueue);
  startDownload();
};

function startDownload() {
  logger('start download');
  for (var i = 0; i < downloadsQueue.length; i++) {
    downloadFile(downloadsQueue[i]);
  };
};

function checkAllFilesDownloaded() {
  logger('check', downloadedQueue);
  if (downloadedQueue.length == downloadsQueue.length) {
    var allDownloded = true;
    for (var i = 0; i < downloadedQueue.length; i++) {
      if (!downloadedQueue[i].downloaded) {
        allDownloded = false;
        break;
      }
    };
    if (allDownloded) {
      downloadService.successCallback(downloadedQueue);
    } else {
      downloadService.errorCallback('Unable to download all files');
    }
  }
};

function downloadFile(url) {
  var filename = downloadService.versionToFetch + '_';
  if (utils.hasFileExtension(url, 'js')) {
    filename = filename + constants.JS_FILE_NAME;
  } else if (utils.hasFileExtension(url, 'css')) {
    filename = filename + constants.CSS_FILE_NAME;
  } else {
    // I don't think this should be able to occur.
    downloadService.errorCallback('Encountered unexpected filetype', url);
  }

  function fileDownloadSuccess(data) {
    var obj = {};
    obj.url = url;
    obj.fileUrl = data;
    obj.downloaded = true;
    downloadedQueue.push(obj);
    checkAllFilesDownloaded();
  };

  function fileDownloadError(error) {
    var obj = {};
    obj.url = url;
    obj.downloaded = false;
    downloadedQueue.push(obj);
    checkAllFilesDownloaded();
  };

  window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(directory) {
      directory.getFile(
        filename, {
          create: true,
          exclusive: false
        },
        function gotFileEntry(fileEntry) {
          var fileTransfer = new FileTransfer();
          fileEntry.remove();
          fileTransfer.download(
            url,
            fileEntry.nativeURL,
            fileDownloadSuccess,
            fileDownloadError);
        },
        fileDownloadError);
    },
    fileDownloadError);
};


module.exports = downloadService;
