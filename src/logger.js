var constants = require('./constants');

/* Logger
–––––––––––––––––––––––––––––––––––––––––––––––––– */
var logger = constants.DEBUG ?
  function () { console.info.apply(this, arguments); }
  : function() { };


module.exports = logger;
