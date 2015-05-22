var logger = require('./logger');

/* Read Service
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var readService = {};

var readQueue = [];
var loadedFiles = [];

readService.setup = function(successCallback, errorCallback) {
  this.successCallback = successCallback;
  this.errorCallback = errorCallback;

  // Ensure these are empty at setup time - this acts as unit test cleanup.
  readQueue = [];
  loadedFiles = [];
};

readService.readUrls = function(urls) {
  if (typeof(urls) === 'string') {
    readQueue.push(urls);
  } else if (urls && urls.constructor === Array) {
    readQueue = urls;
  } else {
    throw 'Url\'s must be String or Array';
  }

  logger('readQueue:', readQueue);
  startReading();
};

function startReading() {
  logger('start reading');
  for (var i = 0; i < readQueue.length; i++) {
    readFile(readQueue[i]);
  };
};

function checkAllFilesRead() {
  logger('check', loadedFiles);
  if (readQueue.length == loadedFiles.length) {
    var allRead = true;
    for (var i = 0; i < loadedFiles.length; i++) {
      if (!loadedFiles[i].read) {
        allRead = false;
        break;
      }
    };
    if (allRead) {
      readService.successCallback(loadedFiles);
    } else {
      readService.errorCallback('Unable to read all files');
    }
  }
};

function readFile(filename) {

  logger(cordova.file.dataDirectory, filename);
  window.resolveLocalFileSystemURL(cordova.file.dataDirectory + filename, readFileSuccess, readFileError);

  function readFileSuccess(fileEntry) {
    logger(fileEntry.nativeURL);
    var obj = {};
    obj.filename = filename;
    obj.fileEntry = fileEntry;
    obj.read = true;
    loadedFiles.push(obj);
    checkAllFilesRead();
  };

  function readFileError(e) {
    logger(e);
    var obj = {};
    obj.filename = filename;
    obj.read = false;
    loadedFiles.push(obj);
    checkAllFilesRead();
  };
};


module.exports = readService;
