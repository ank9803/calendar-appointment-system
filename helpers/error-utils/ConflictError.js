'use strict';

const util = require('util');

module.exports = function ConflictError(message, originalError) {
  Error.call(this);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack;
  }

  if (originalError) {
    this.originalError = originalError;
  }

  this.name = this.constructor.name;
  this.code = 'CONFLICT_ERROR';
  this.message = message;
  this.status = 409;
};

util.inherits(module.exports, Error);
