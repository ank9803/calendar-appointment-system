'use strict';

const {getFirestoreDb} = require('../models');
const db = getFirestoreDb();
const {ValidationError, ConflictError} = require('../helpers/error-utils');
const _ = require('lodash');
const moment = require('moment');

/**
 * Create an instance of the event service that process APIs for calendar events
 */
class EventService {

  /**
   * Create calendar event for the user
   *
   * @param {Object} payload - The event payload
   */
  async createEvent(payload) {
    const validationFail = _validateCreateEventPayload(payload);
    if (!_.isEmpty(validationFail)) {
      return Promise.reject(validationFail);
    }

    const eventDatetime = payload.date_time;

    let queryObj = {
      eventDateObj: new Date(moment(eventDatetime).format('YYYY-MM-DD')),
      slotDateTime: eventDatetime.split('.').length !== 1? eventDatetime.split('.')[0] + 'Z': eventDatetime.split('.')[0]
    };

    let slotObj = await _allocateSlotToEvent(queryObj);
    if (!_.isEmpty(slotObj.error)) {
      return Promise.reject(slotObj.error);
    }

    return slotObj;
  }

  /**
   * Get the list of calendar events for the user
   *
   * @param {object} swaggerParams - The request arguments passed in from the controller
   */
  async listEvents(swaggerParams) {
    const validationFail = _validateListEventsParam(swaggerParams);
    if (!_.isEmpty(validationFail)) {
      return Promise.reject(validationFail);
    }

    const startDate = swaggerParams.start_date.value;
    const endDate = swaggerParams.end_date.value;
    const eventQuery = await db.collection('events')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();
    if (eventQuery.empty) {
      return [];
    }
    let events = [];
    eventQuery.forEach((eventSnapshot) => {
      let event = eventSnapshot.data();
      let eventObj = {date: event.date.toDate(), slots: []};
      event.slots.forEach((slot) => {
        eventObj.slots.push({time: slot.time.toDate(), status: slot.status});
      });
      events.push(eventObj);
    });
    return events;
  }
}

module.exports = EventService;

/**
 * Update the event doc from the events collection to allocate the slot to the event
 *
 * @param {Object} query - The query to search event for
 *
 * @return {Object} - The event document or validation error
 */
async function _allocateSlotToEvent(query) {
  let eventsRef = db.collection('events');
  let eventQuery = await eventsRef.where('date', '==', query.eventDateObj).get();

  if (eventQuery.empty) {
    return {
      error: new ValidationError('The event cannot be created as there are no events allowed for this date')
    };
  }
  const eventDoc = eventQuery.docs[0].data();
  let slot = eventDoc.slots.find((slot) => {
    let slotTime = slot.time.toDate().toISOString().split('.')[0] + 'Z';
    if (slotTime === query.slotDateTime) {
      return slot;
    }
  });
  if (_.isEmpty(slot)) {
    return {
      error: new ValidationError('The event cannot be created as the requested time slot does not exist')
    };
  }
  if (slot.status !== 'available') {
    return {
      error: new ConflictError('The event cannot be created as the event already exist for this date time')
    };
  }
  slot.status = 'occupied';
  await eventsRef.doc(eventQuery.docs[0].id)
    .update({
      slots: eventDoc.slots
    });
  return {
    status: slot.status,
    time: slot.time.toDate()
  };
}

/**
 * Validate the parameters while finding list of events
 *
 * @param {Object} swaggerParams - The swagger parameter
 *
 * @return {null | Object} - Validation error
 */
function _validateListEventsParam(swaggerParams) {
  const startDate = swaggerParams.start_date.value;
  const endDate = swaggerParams.end_date.value;

  let error;

  if (new Date(endDate) <= new Date(startDate)) {
    error = new ValidationError(
      'Validation error occurred while listing events',
      [
        {
          code: 'INVALID_START_END_DATE',
          message: 'The start date must be less than end date',
          path: []
        }
      ]
    );
  }
  return error;
}

/**
 * Validate the payload while creating event
 *
 * @param {Object} payload - The event payload
 *
 * @return {null | Object} - Validation error
 */
function _validateCreateEventPayload(payload) {
  const eventDatetime = payload.date_time;
  let error;

  if (new Date(eventDatetime).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
    error = new ValidationError(
      'Validation error occurred while creating events',
      [
        {
          code: 'INVALID_DATE_TIME',
          message: 'You cannot create event for past date',
          path: ['date_time']
        }
      ]
    );
  }
  return error;
}