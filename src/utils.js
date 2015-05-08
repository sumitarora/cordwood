
/* Utils
–––––––––––––––––––––––––––––––––––––––––––––––––– */
function checkIfJsFile(filename) {
  return filename && filename.indexOf('.js') !== -1;
};


module.exports.isJsFile = checkIfJsFile;
