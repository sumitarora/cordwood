var readService = require('../src/read-service');

var stringUrl = 'local/file/path/something.js';
var urlArray = ['local/file/path/something.js', 'local/file/path/another-thing.css'];

describe('Read Service', function() {

  describe('setup', function() {

    readService.setup(function() {}, function() {});

    it('should set successCallback', function() {
      expect(readService).to.have.property('successCallback');
      expect(readService.successCallback).to.be.a('function');
    });

    it('should set errorCallback', function() {
      expect(readService).to.have.property('errorCallback');
      expect(readService.errorCallback).to.be.a('function');
    });

  });


  describe('readUrls', function() {

    it('should read a single string URL', function() {
      expect(function () { readService.readUrls(stringUrl); })
        .to.not.throw(Error);
    });

    it('should read multiple URLs passed in as an array', function() {
      expect(function () { readService.readUrls(urlArray); })
        .to.not.throw(Error);
    });

    it('should fail if object or function passed in as URLs', function() {
      expect(function () { readService.readUrls({}); })
        .to.throw('Url\'s must be String or Array');

      expect(function () { readService.readUrls(function() {}) })
        .to.throw('Url\'s must be String or Array');
    });

  });

});
