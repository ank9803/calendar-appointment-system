'use strict';

const EventService = require('../services/EventService');
const _ = require('lodash');

/**
 * Create calendar event for the user
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createEvent = async (req, res, next) => {
  const payload = _.get(req, 'swagger.params.event_payload.value', {});
  const eventService = new EventService();

  try {
    const createdEvent = await eventService.createEvent(payload);

    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(createdEvent));

  } catch (error) {
    return next(error);
  }
};

/**
 * Get the list of calendar events for the user
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.listEvents = async (req, res, next) => {
  const swaggerParams = req.swagger.params || {};
  const eventService = new EventService();

  try {
    const eventList = await eventService.listEvents(swaggerParams);
    res.setHeader('Content-Type', 'application/json');

    if (_.isEmpty(eventList)) {
      res.statusCode = 204;
      return res.end();
    }
    res.statusCode = 200;
    return res.end(JSON.stringify(eventList));

  } catch (error) {
    return next(error);
  }
};