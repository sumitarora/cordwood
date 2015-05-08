var bootstrap = require('../src/bootstrap');

describe('Bootstrap', function() {

  describe('setup', function() {

    bootstrap.setup(function() {}, function() {});

    it('should set successCallback', function() {
      expect(bootstrap).to.have.property('successCallback');
      expect(bootstrap.successCallback).to.be.a('function');
    });

    it('should set errorCallback', function() {
      expect(bootstrap).to.have.property('errorCallback');
      expect(bootstrap.errorCallback).to.be.a('function');
    });

  });


  describe('injectFile', function() {

    before(function () {
      bootstrap.injectFile('my-app_v_1.1.1.js', 'JS');
    });

    it('should inject a JS file', function() {
      var scripts = document.getElementsByTagName('script');
      var result = false;

      for (var i = scripts.length - 1; i >= 0; i--) {
        result = (result || scripts[i].getAttribute('src') === 'my-app_v_1.1.1.js');
      };

      expect(result).to.be.true;
    });

    before(function () {
      bootstrap.injectFile('my-app_v_1.1.1.css', 'CSS');
    });

    it('should inject a CSS file', function() {
      var links = document.getElementsByTagName('link');
      var result = false;

      for (var i = links.length - 1; i >= 0; i--) {
        result = (result || links[i].getAttribute('href') === 'my-app_v_1.1.1.css');
      };

      expect(result).to.be.true;
    });

  });

});
