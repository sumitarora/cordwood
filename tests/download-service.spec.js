var downloadService = require('../src/download-service');

var stringUrl = 'http://host:port/api/something.js';
var urlArray = ['http://host:port/api/something.js', 'http://host:port/api/another-thing.css'];

describe('Download Service', function() {

  describe('setup', function() {

    downloadService.setup(function() {}, function() {}, '1.0.0');

    it('should set versionToFetch', function() {
      expect(downloadService).to.have.property('versionToFetch');
    });

    it('should set successCallback', function() {
      expect(downloadService).to.have.property('successCallback');
      expect(downloadService.successCallback).to.be.a('function');
    });

    it('should set errorCallback', function() {
      expect(downloadService).to.have.property('errorCallback');
      expect(downloadService.errorCallback).to.be.a('function');
    });

  });


  describe('downloadUrls', function() {

    it('should download a single string URL', function() {
      expect(function () { downloadService.downloadUrls(stringUrl); })
        .to.not.throw(Error);
    });

    it('should download multiple URLs passed in as an array', function() {
      expect(function () { downloadService.downloadUrls(urlArray); })
        .to.not.throw(Error);
    });

    it('should fail if object or function passed in as URLs', function() {
      expect(function () { downloadService.downloadUrls({}); })
        .to.throw('Url\'s must be String or Array');

      expect(function () { downloadService.downloadUrls(function() {}) })
        .to.throw('Url\'s must be String or Array');
    });

  });
});
