var constants = require('./constants');
var utils = require('./utils');
var logger = require('./logger');

/* Download Service
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var downloadService = {};

downloadService.setup = function(successCallback, errorCallback, versionToFetch) {
  this.versionToFetch = versionToFetch;
  this.successCallback = successCallback;
  this.errorCallback = errorCallback;
  logger('version being fetched by download: ', versionToFetch);
};

var downloadsQueue = [];
var downloadedQueue = [];

downloadService.downloadUrls = function(urls) {
  if (typeof(urls) === 'string') {
    downloadsQueue.push(urls);
  } else if (urls.constructor === Array) {
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
  if (utils.isJsFile(url)) {
    filename = filename + constants.JS_FILE_NAME;
  } else {
    filename = filename + constants.CSS_FILE_NAME;
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
