var version = require('../src/version');

describe('Version', function() {

  describe('Current', function() {

    before(function () {
      version.setCurrent('1.0.0');
    });

    it('should be able to set current version', function() {
      expect(version.getCurrent()).to.be.equal('1.0.0');
    });

    it('should be able to set localStorage.CURRENT_VERSION', function() {
      expect(localStorage.CURRENT_VERSION).to.be.equal('1.0.0');
    });

    it('should keep current version and localStorage.CURRENT_VERSION in sync', function() {
      version.setCurrent('1.0.1');
      expect(localStorage.CURRENT_VERSION).to.be.equal(version.getCurrent());
    });

  });


  describe('fetchLatestVersion', function() {

    before(function () {
      this.server = sinon.fakeServer.create();
      this.server.xhr.useFilters = true;
      this.server.autoRespond = true;
    });

    after(function () {
      this.server.respond();
      this.server.restore();
    });

    it('should be able to fetch new version', function() {
      this.server.respondWith(/\/version\?(\d+)/, function(xhr, id) {
        xhr.response = { version: '1.1.0' };
        xhr.respond(200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ version: '1.1.0' }));
        });

      version.fetchLatestVersion('/version', function(newVersion) {
        expect(newVersion).to.be.equal('1.1.0');
      });
    });

  });

});
