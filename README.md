# cordova-auto-reload

- create cordova app
- run app and test
- add plugins org.apache.cordova.file-transfer, org.apache.cordova.file
- npm install gulp-car plugin
- add build task to gulp file as shown below

```
var gcar = require('gulp-car');


gulp.task('car', function() {
  var options = {
    'htmlPath': 'www/templates/**/*.html',
    'cssPath': 'www/css/**/*.css',
    'jsPath': 'www/js/**/*.js',
  };
  return gcar.build(options);
});
```

- bower install https://github.com/rangle/cordova-auto-reload.git


- Remove js and css file links from the index.html and include reload.js
```
<script src="lib/cordova-auto-reload/src/reload.js"></script>
```

- Remove ng-app="starter" from body tag

- Add the below code to download files and load it from server. (You would have to run server locally and add url links) below.
```
<script type="text/javascript">

function successCallback() {
  console.log('all files read success');
  angular.element(document).ready(function() {
    angular.bootstrap(document, ['starter']);
  });
};

function errorCallback() {
  console.log('error reading files');
  window.location = "error.html";
};

document.addEventListener("deviceready", function(){
  var options = {};
  options.versionUrl = 'http://10.0.1.79:8080/version.json';
  options.javascriptUrl = 'http://10.0.1.79:8080/app.js';
  options.cssUrl = 'http://10.0.1.79:8080/app.css';
  options.currentVersion = '1.0.0';
  options.successCallback = successCallback;
  options.errorCallback = errorCallback;

  var cordovaAutoReload = new CordovaAutoReload(options);
}, false);

</script>    
```

- Run the app it should run fine.

- If everythings ok try changing the application and change version number and deploy it on server and check app gets updated without reload
