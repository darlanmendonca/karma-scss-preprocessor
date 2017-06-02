'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeSass = require('node-sass');

var _nodeSass2 = _interopRequireDefault(_nodeSass);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function formattedScssMessage(error, file) {
  var filePath = !error || !error.file || error.file === 'stdin' ? file.path : error.file;
  var relativePath = _path2.default.relative(process.cwd(), filePath);

  return _chalk2.default.underline(relativePath) + '\n' // eslint-disable-line prefer-template
  + _chalk2.default.gray(' ' + error.line + ':' + error.column + ' ') + error.message.replace(/: "([^"]*)"\.$/, ': $1').replace(/: (.*)/, ': ' + _chalk2.default.yellow('$1'));
}

/**
 * Preprocessor factory
 * @param args   {Object} Config object of custom preprocessor.
 * @param config {Object} Config object of scssPreprocessor.
 * @param logger {Object} Karma's logger.
 * @param helper {Object} Karma's helper functions.
 */
function createScssPreprocessor(args) {
  var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var logger = arguments[2];

  var log = logger.create('preprocessor.scss');

  // Options. See https://www.npmjs.com/package/node-sass for details
  var options = _lodash2.default.merge({
    sourceMap: false,
    transformPath: function transformPath(filepath) {
      return filepath.replace(/\.scss$/, '.css');
    }
  }, args.options || {}, config.options || {});

  return function processFile(content, file, done) {
    var result = null;

    log.debug('Processing "%s".', file.originalPath);

    // Transform file.path to .css so Karma serves it as a stylesheet
    file.path = file.originalPath.replace(/\.scss$/, '.css'); // eslint-disable-line

    // Clone the options because we need to mutate them
    var opts = _lodash2.default.clone(options);

    // Add current file's directory into include paths
    opts.includePaths = [_path2.default.dirname(file.originalPath)].concat(opts.includePaths || []);

    // Inline source maps
    if (opts.sourceMap) {
      opts.sourceMap = file.path;
      opts.omitSourceMapUrl = true;
    }

    // Compile using node-sass (synchronously)
    try {
      opts.file = file.originalPath;
      result = _nodeSass2.default.renderSync(opts);
    } catch (error) {
      var message = formattedScssMessage(error, file);
      log.error('%s\n  at %s:%d', message, file.originalPath, error.line);
      error.message = _chalk2.default.stripColor(message);
      return done(error, null);
    }

    done(null, result.css || result);
    return undefined;
  };
}

// Inject dependencies
createScssPreprocessor.$inject = ['args', 'config.scssPreprocessor', 'logger'];

// Export preprocessor
exports.default = {
  'preprocessor:scss': ['factory', createScssPreprocessor]
};
module.exports = exports['default'];