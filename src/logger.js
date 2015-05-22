var constants = require('./constants');

/* Logger
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var logger = function() {
  if (constants.DEBUG) {
    console.info.apply(this, arguments);
  }
};

module.exports = logger;
