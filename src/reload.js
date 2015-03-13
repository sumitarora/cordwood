function CordovaAutoReload(versionUrl, javascriptUrl, cssUrl, currentVersion) {

  var d = new Date();
  var JS_FILE_NAME = d.getTime() + 'app.js';
  var CSS_FILE_NAME = d.getTime() + 'app.css';

  function checkIfJsFile(filename) {
    return filename.indexOf('.js') > -1;
  }

  //------------------------------------------------ Version Check ----------------------------------------------//

  var updatedVersion;

  (function init() {

    if (localStorage.CURRENT_VERSION === undefined) {
      localStorage.CURRENT_VERSION = currentVersion;
    }
    checkIfVersionChanged();
  })();

  function checkIfVersionChanged() {
    console.log('checking version change', versionUrl);
    $.ajax({
      type: "GET",
      url: versionUrl + '?' + (new Date()).getTime(),
      success: onVersionSuccess,
      error: onServerError
    });
  }

  function onVersionSuccess(data) {
    console.log('version from server:', data.version);
    console.log('version at local:', localStorage.CURRENT_VERSION);

    updatedVersion = data.version;
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
  };

  function fetchUpdatedVersion() {
    console.log('version changed calling api to fetch file');

    var files = [javascriptUrl, cssUrl];
    var s = new DownloadService(allFilesDownloaded, errorWhileDownloading);
    s.downloadUrls(files);
  }

  function onServerError(e) {
    console.log(e);
    loadFilesAndInitializeApp();
  }

  //------------------------------------------------ Read and Load Files ----------------------------------------------//

  function loadFilesAndInitializeApp() {
    window.resolveLocalFileSystemURL(cordova.file.dataDirectory + localStorage.CURRENT_VERSION + "_" + JS_FILE_NAME, readFile, fileReadError);
    window.resolveLocalFileSystemURL(cordova.file.dataDirectory + localStorage.CURRENT_VERSION + "_" + CSS_FILE_NAME, readFile, fileReadError);
  }

  function fileReadError(e) {
    console.log(e);
    fetchUpdatedVersion();
  }

  function readFile(fileEntry) {
    console.log(fileEntry.nativeURL);
    if (checkIfJsFile(fileEntry.nativeURL)) {
      loadjscssfile(fileEntry.nativeURL, "js");
    } else {
      loadjscssfile(fileEntry.nativeURL, "css");
    }

    setTimeout(function() {
      angular.element(document).ready(function() {
        angular.bootstrap(document, ['starter']);
      });
    }, 500);
  }

  function onError(e) {
    console.log(e);
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
  //------------------------------------------------ Read Service ----------------------------------------------//




  //------------------------------------------------ Download Service ----------------------------------------------//

  function DownloadService(successCallback, errorCallback) {

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