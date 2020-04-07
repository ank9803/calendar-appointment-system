'use strict';

/**
 * Create an instance of the status details service
 */
class StatusDetailsService {

  /**
   * Get the system status(uptime)
   *
   * @param {object} swaggerParams - The request arguments passed in from the controller
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   *
   * @return {Object} The system up time details
   */
  getSystemStatus(swaggerParams, res, next) {
    return {
      up_time: Math.floor(process.uptime())
    };
  }
}

module.exports = StatusDetailsService;
