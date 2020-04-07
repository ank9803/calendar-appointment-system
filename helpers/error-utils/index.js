'use strict';
const ErrorHandler = require('./ErrorHandler');
const ConflictError = require('./ConflictError');
const ValidationError = require('./ValidationError');

module.exports = {
  ErrorHandler,
  ConflictError,
  ValidationError,
  configure: ErrorHandler.configure
};