function CordovaAutoReload(versionUrl, javascriptUrl, cssUrl, currentVersion) {

  var JS_FILE_NAME = 'app.js';
  var CSS_FILE_NAME = 'app.css';
  var updatedVersion;

  function checkIfJsFile(filename) {
    return filename.indexOf('.js') > -1;
  }

  //------------------------------------------------ Version Check ----------------------------------------------//

  (function init() {

    if (localStorage.CURRENT_VERSION === undefined) {
      localStorage.CURRENT_VERSION = currentVersion;
      updatedVersion = currentVersion;
      fetchUpdatedVersion();
    } else {
      updatedVersion = localStorage.CURRENT_VERSION;
      checkIfVersionChanged();
    }

  })();

  function checkIfVersionChanged() {
    console.log('checking version change', versionUrl);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', (versionUrl + '?' + (new Date()).getTime()), true);
    xhr.responseType = 'json';

    xhr.onerror = function(e) {
      console.log('unable to check version', e);
      loadFilesAndInitializeApp();
    };

    xhr.onreadystatechange = function(e) {
      if (this.readyState == 4 && this.status == 200) {
        onVersionSuccess(this.response);
      }
    };

    xhr.send();
  }

  function onVersionSuccess(data) {
    console.log('version from server:', data);
    console.log('version at local:', localStorage.CURRENT_VERSION);

    if (data.version) {
      updatedVersion = data.version;
    }
    if (data.version !== localStorage.CURRENT_VERSION) {
      fetchUpdatedVersion();
    } else {
      loadFilesAndInitializeApp();
    }
  }

  function allFilesDownloaded(files) {
    localStorage.CURRENT_VERSION = updatedVersion;
    console.log('files', files);
    loadFilesAndInitializeApp();
  };

  function errorWhileDownloading(error) {
    console.log(error);
    loadFilesAndInitializeApp();
  };

  function fetchUpdatedVersion() {
    console.log('version changed calling api to fetch file');

    var files = [javascriptUrl, cssUrl];
    var s = new DownloadService(allFilesDownloaded, errorWhileDownloading);
    s.downloadUrls(files);
  }

  function onServerError(e) {
    console.log(e);
    fetchUpdatedVersion();
  }

  //------------------------------------------------ Read and Load Files ----------------------------------------------//

  function allFilesRead(files) {
    console.log('files', files);
    for (var i = 0; i < files.length; i++) {
      var fileEntry = files[i].fileEntry;
      if (checkIfJsFile(fileEntry.nativeURL)) {
        loadjscssfile(fileEntry.nativeURL, "js");
      } else {
        loadjscssfile(fileEntry.nativeURL, "css");
      }
    }

    setTimeout(function() {
      angular.element(document).ready(function() {
        angular.bootstrap(document, ['starter']);
      });
    }, 500);

  };

  function errorReadingFiles(error) {
    console.log(error);
    //fetchUpdatedVersion();
  };

  function loadFilesAndInitializeApp() {
    if (localStorage.CURRENT_VERSION !== undefined) {
      var files = [localStorage.CURRENT_VERSION + "_" + JS_FILE_NAME, localStorage.CURRENT_VERSION + "_" + CSS_FILE_NAME];
      var r = new ReadService(allFilesRead, errorReadingFiles);
      r.readUrls(files);
    } else {
      fetchUpdatedVersion();
    }
  }

  function loadjscssfile(filename, filetype) {
    if (filetype == "js") {
      var fileref = document.createElement('script')
      fileref.setAttribute("type", "text/javascript")
      fileref.setAttribute("src", filename)
    } else if (filetype == "css") {
      var fileref = document.createElement("link")
      fileref.setAttribute("rel", "stylesheet")
      fileref.setAttribute("type", "text/css")
      fileref.setAttribute("href", filename)
    }
    if (typeof fileref != "undefined")
      document.getElementsByTagName("head")[0].appendChild(fileref)
  }

  //------------------------------------------------ Read Service ----------------------------------------------//
  function ReadService(successCallback, errorCallback) {
    var readQueue = [];
    var loadedFiles = [];

    this.readUrls = function(urls) {
      if (typeof(urls) === "string") {
        readQueue.push(urls);
      } else if (typeof(urls) === "object") {
        readQueue = urls;
      } else {
        throw "Url's must be String or Array";
      }
      console.log('readQueue:', readQueue);
      startReading();
    };

    function startReading() {
      console.log('start reading');
      for (var i = 0; i < readQueue.length; i++) {
        readFile(readQueue[i]);
      };
    };

    function checkAllFilesRead() {
      console.log('check', loadedFiles);
      if (readQueue.length == loadedFiles.length) {
        var allRead = true;
        for (var i = 0; i < loadedFiles.length; i++) {
          if (!loadedFiles[i].read) {
            allRead = false;
            break;
          }
        };
        if (allRead) {
          successCallback(loadedFiles);
        } else {
          errorCallback('Unable to read all files');
        }
      }
    };

    function readFile(filename) {

      console.log(cordova.file.dataDirectory);
      console.log(filename);
      window.resolveLocalFileSystemURL(cordova.file.dataDirectory + filename, readFileSuccess, readFileError);

      function readFileSuccess(fileEntry) {
        console.log(fileEntry.nativeURL);
        var obj = {};
        obj.filename = filename;
        obj.fileEntry = fileEntry;
        obj.read = true;
        loadedFiles.push(obj);
        checkAllFilesRead();
      };

      function readFileError(e) {
        console.log(e);
        var obj = {};
        obj.filename = filename;
        obj.read = false;
        loadedFiles.push(obj);
        checkAllFilesRead();
      };
    };


  };
  //------------------------------------------------ Read Service ----------------------------------------------//


  //------------------------------------------------ Download Service ----------------------------------------------//

  function DownloadService(successCallback, errorCallback) {
    console.log('version inside download: ', updatedVersion);

    var downloadsQueue = [];
    var downloadedQueue = [];

    this.downloadUrls = function(urls) {
      if (typeof(urls) === "string") {
        downloadsQueue.push(urls);
      } else if (typeof(urls) === "object") {
        downloadsQueue = urls;
      } else {
        throw "Url's must be String or Array";
      }
      console.log('downloadsQueue:', downloadsQueue);
      startDownload();
    };

    function startDownload() {
      console.log('start download');
      for (var i = 0; i < downloadsQueue.length; i++) {
        downloadFile(downloadsQueue[i]);
      };
    };

    function checkAllFilesDownloaded() {
      console.log('check', downloadedQueue);
      if (downloadedQueue.length == downloadsQueue.length) {
        var allDownloded = true;
        for (var i = 0; i < downloadedQueue.length; i++) {
          if (!downloadedQueue[i].downloaded) {
            allDownloded = false;
            break;
          }
        };
        if (allDownloded) {
          successCallback(downloadedQueue);
        } else {
          errorCallback('Unable to download all files');
        }
      }
    };

    function downloadFile(url) {
      var filename = updatedVersion + '_';
      if (checkIfJsFile(url)) {
        filename = filename + JS_FILE_NAME;
      } else {
        filename = filename + CSS_FILE_NAME;
      }
      console.log(filename);

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

  };
  //------------------------------------------------ Download Service ----------------------------------------------//

};