'use strict';

const TimeSlotService = require('../services/TimeSlotService');
const _ = require('lodash');

/**
 * Get the list of all the free time slot available for the given date
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.listFreeTimeSlots = async (req, res, next) => {
  const swaggerParams = req.swagger.params || {};
  const timeSlotService = new TimeSlotService();

  try {
    const freeTimeSlots = await timeSlotService.listFreeTimeSlots(swaggerParams);
    res.setHeader('Content-Type', 'application/json');

    if (_.isEmpty(freeTimeSlots)) {
      res.statusCode = 204;
      return res.end();
    }
    res.statusCode = 200;
    return res.end(JSON.stringify(freeTimeSlots));

  } catch (error) {
    return next(error);
  }
};

/**
 * Creates the time slots for given date
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createTimeSlots = async (req, res, next) => {
  const payload = _.get(req, 'swagger.params.slot_payload.value', {});
  const timeSlotService = new TimeSlotService();

  try {
    const createdTimeSlots = await timeSlotService.createTimeSlots(payload);

    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(createdTimeSlots));

  } catch (error) {
    return next(error);
  }
};