var utils = require('../src/utils');

describe('Utils', function() {

  describe('isJsFile', function() {

    it('should return true if \'.js\' suffix present', function() {
      expect(utils.isJsFile('my-file-name.js')).to.be.true;
    });

    it('should return false if filename has no \'.js\' suffix', function() {
      expect(utils.isJsFile('my-file-name.css')).to.be.false;
      expect(utils.isJsFile('my-file-name')).to.be.false;
      expect(utils.isJsFile('my-file-namejs')).to.be.false;
    });

  });
});
