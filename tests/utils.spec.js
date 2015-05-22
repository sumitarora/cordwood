var utils = require('../src/utils');

describe('Utils', function() {

  describe('hasFileExtension', function() {

    it('should return true if \'.js\' suffix present', function() {
      expect(utils.hasFileExtension('my-file-name.js', 'js')).to.be.true;
      // Should be case insensitive, too.
      expect(utils.hasFileExtension('my-file-name.js', 'JS')).to.be.true;
      expect(utils.hasFileExtension('my-file-name.JS', 'JS')).to.be.true;
      expect(utils.hasFileExtension('my-file-name.JS', 'js')).to.be.true;

      // Should also allow for '.js' to appear more than once, not only at the
      // end.
      expect(utils.hasFileExtension('my-file-name.js.more-things.js', 'js')).to.be.true;
    });

    it('should return false if filename has no \'.js\' suffix', function() {
      expect(utils.hasFileExtension('my-file-name.css', 'js')).to.be.false;
      expect(utils.hasFileExtension('my-file-name.jsp', 'js')).to.be.false;
      expect(utils.hasFileExtension('my-file-name', 'js')).to.be.false;
      expect(utils.hasFileExtension('my-file-namejs', 'js')).to.be.false;
    });

    it('should return false if \'.js\' appears inside the file name', function () {
      expect(utils.hasFileExtension('my-file-name.js.nope', 'js')).to.be.false;
    });
  });
});
