
/* Utils
–––––––––––––––––––––––––––––––––––––––––––––––––– */

/**
 * Function for checking if the filename ends with the provided file extension.
 * This function is case insensitive.
 * @param filename : The filename to check
 * @param extension : The extension to check for.
 **/
function hasFileExtension(filename, extension) {
  // Ensure both values are present, otherwise it's not worth comparing.
  if (filename && extension) {
    // Normalize the extension to lowercase, and add the leading `.`
    var fullExtension = '.' + extension.toLowerCase();
    // The position in the filename where the extension begins.
    var index = filename.length - fullExtension.length;

    return filename.toLowerCase().lastIndexOf(fullExtension) === index;
  } else {
    return false;
  }
};


module.exports.hasFileExtension = hasFileExtension;
