'use strict';

const ServerError = require('./ServerError');
const RuntimeError = require('./RuntimeError');
const _ = require('lodash');
let configuration = null;
const logLevels = [
  'info',
  'crit',
  'error',
  'warning',
  'notice',
  'debug',
  'emerg',
  'alert'
];

module.exports = {

  onError: function onError(error, request, response, next) {
    if (error.status) {
      error = _prepareError(error, response, error.status);

    } else if (response.statusCode) {
      error = _prepareError(error, response, response.statusCode);
    } else {
      // this means that it is not a validation or customs error so it has to be an internal server error
      error = _prepareServerErrorForDisplay(error, response);
    }

    let displayError = _prepareDisplayErrorPerEnvironment(error);

    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(displayError));
  },

  configure(config) {
    configuration = _setDefaultOrValidateConfig(config);
  }
};

function _prepareError(error, response, statusCode) {
  let config = configuration;
  // This is to change the status code to 406 since it has been incorrectly set to 400 by the lib we are using
  if (!_.isNil(error.message) && error.message.indexOf('Invalid content type') >= 0) {
    statusCode = 406;
  }
  if (config['client_errors'] && config['client_errors'].hasOwnProperty(statusCode)) {
    if (!_.isNil(config['client_errors'][statusCode].error_code)) {
      error.code = config['client_errors'][statusCode].error_code;
      error = _prepareClientErrorForDisplay(error);
      response.statusCode = statusCode;
    } else {
      error = _prepareClientErrorForDisplay(error);
      response.statusCode = statusCode;
    }
    return error;
  }

  if (config['server_errors'] && Array.isArray(config['server_errors'])) {
    if (config['server_errors'].indexOf(statusCode) !== -1) {
      error = _prepareServerErrorForDisplay(error, response, statusCode);
    } else {
      error = _prepareServerErrorForDisplay(error, response);
    }
  }
  return error;
}

function _prepareClientErrorForDisplay(error) {
  let errForDisplay = {};
  if (error.code) {
    errForDisplay.code = error.code;
  } else {
    errForDisplay.code = 'VALIDATION_ERROR';
  }

  if (error.message) {
    errForDisplay.message = error.message;
  }
  if (error.results) {
    errForDisplay.errors = error.results.errors;
  }
  if (error.exceptionCode) {
    errForDisplay.exceptionCode = error.exceptionCode;
  }
  return errForDisplay;
}

function _prepareServerErrorForDisplay(error, response, statusCode) {
  if (statusCode) {
    response.statusCode = statusCode;
  } else {
    response.statusCode = 500;
  }
  return new ServerError(error, error.originalError);
}

function _setDefaultOrValidateConfig(config) {
  let _clonedConfig = _.cloneDeep(config);
  let clientErrors = {
    '400': {'error_code': null, 'log_level': 'error'},
    '409': {'error_code': null, 'log_level': 'error'}
  };
  let serverErrors = [504, 502, 500];

  if (_.isEmpty(_clonedConfig)) {
    _clonedConfig.client_errors = clientErrors;
    _clonedConfig.server_errors = serverErrors;
    return _clonedConfig;
  }

  if (_.isEmpty(_clonedConfig.client_errors)) {
    _clonedConfig.client_errors = clientErrors;
  }

  if (!_.isEmpty(_clonedConfig.client_errors)) {
    let invaildConfigErrors = [];
    _.forOwn(_clonedConfig.client_errors, (value, key) => {
      if (_.isString(_clonedConfig.client_errors[key])||
        _clonedConfig.client_errors[key] === null) {

        _clonedConfig.client_errors[key] = {'error_code': _clonedConfig.client_errors[key], 'log_level': 'error'};
      }
      if (_.isObject(_clonedConfig.client_errors[key]) &&
        !_.has(_clonedConfig.client_errors[key], 'error_code')) {

        _clonedConfig.client_errors[key]['error_code'] = null;
      }
      if (_.isObject(_clonedConfig.client_errors[key]) &&
        _.isEmpty(_clonedConfig.client_errors[key]['log_level'])) {

        _clonedConfig.client_errors[key]['log_level'] = 'error';
      }
      if (!_.includes(logLevels, _clonedConfig.client_errors[key]['log_level'])) {
        let error = {
          message: 'Invalid log level found for ' + key + ' in client errors',
          path: ['config', 'client_errors', key, 'log_level']
        };
        invaildConfigErrors.push(error);
      }
    });
    if (!_.isEmpty(invaildConfigErrors)) {
      throw new RuntimeError('The Invalid configuration has been set', invaildConfigErrors);
    }
  }

  if (_.isEmpty(_clonedConfig.server_errors)) {
    _clonedConfig.server_errors = serverErrors;
  }

  return _clonedConfig;
}

function _prepareDisplayErrorPerEnvironment(error) {
  let config = configuration;
  // Remove the stack if it is there and debug is false.
  if (!config.bDebug && error.stack) {
    delete error.stack;
  }
  if (!config.bDebug && !_.isNil(error.stackTrace)) {
    delete error.stackTrace;
  }

  return error;
}