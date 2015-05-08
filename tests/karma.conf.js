module.exports = function(config) {
  config.set({
    basePath: '../',
    frameworks: ['browserify', 'mocha', 'chai', 'sinon'],
    files: [
      'tests/mocks/*.mock.js',
      'tests/**/*.spec.js'
    ],
    preprocessors: {
      'tests/**/*.spec.js': ['browserify']
    },
    browserify: {
      debug: true,
      transform: ['browserify-istanbul']
    },
    reporters: ['coverage', 'mocha'],
    coverageReporter: {
      type : 'lcov',
      reporters: [{
        type: 'text-summary'
      }]
    },
    colors: true,
    logLevel: config.LOG_ERROR,
    browsers: ['PhantomJS']
  });
};
