'use strict';

const {getFirestoreDb} = require('../models');
const db = getFirestoreDb();
const {ValidationError, ConflictError} = require('../helpers/error-utils');
const config = require('config');
const moment = require('moment');
const _ = require('lodash');

/**
 * Create an instance of the time slot service that process APIs for time slots
 */
class TimeSlotService {

  /**
   * Get the list of all the free slot available for the given date
   *
   * @param {object} swaggerParams - The request arguments passed in from the controller
   */
  async listFreeTimeSlots(swaggerParams) {
    const freeSlotDate = swaggerParams.date.value;

    let eventsRef = db.collection('events');
    let eventQuery = await eventsRef.where('date', '==', freeSlotDate).get();

    if (eventQuery.empty) {
      return [];
    }
    const snapshot = eventQuery.docs[0];
    let freeSlots = [];
    snapshot.data().slots.forEach((slot) => {
      if (slot.status === 'available') {
        freeSlots.push(slot.time.toDate());
      }
    });
    return freeSlots;
  }

  /**
   * Creates the time slots for given date
   *
   * @param {Object} payload - The payload for creating time slots
   */
  async createTimeSlots(payload) {
    const payloadValidationFail = await _validateTimeSlotPayload(payload);
    if (!_.isEmpty(payloadValidationFail)) {
      return Promise.reject(payloadValidationFail);
    }

    const timeSlotDate = payload.time_slot_date;
    const startHour = config.get('event.start_hour');
    const endHour = config.get('event.end_hour');
    const duration = config.get('event.duration');

    let startDateTime = new Date(moment(timeSlotDate + ',' + startHour).format());
    let endDateTime = new Date(moment(timeSlotDate + ',' + endHour).format());
    let eventObj = {
      date: new Date(timeSlotDate),
      start_time: startHour,
      end_time: endHour,
      slots: []
    };
    do {
      eventObj.slots.push({
        status: 'available',
        time: startDateTime
      });
      startDateTime = new Date(moment(startDateTime).add(duration, 'minutes'));
    } while (startDateTime < endDateTime);
    let eventsRef = db.collection('events');
    await eventsRef.add(eventObj);
    return eventObj;

  }
}

module.exports = TimeSlotService;

/**
 * Validate the time slot payload while creating time slots
 *
 * @param {Object} payload - The time slot payload
 *
 * @return {null | Object} - Validation error
 */
async function _validateTimeSlotPayload(payload) {
  const timeSlotDate = payload.time_slot_date;
  let error;

  if (new Date(timeSlotDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
    error = new ValidationError(
      'Validation error occurred while creating time slots',
      [
        {
          code: 'INVALID_TIME_SLOT_DATE',
          message: 'The time slot date cannot be in past',
          path: ['time_slot_date']
        }
      ]
    );

    return error;
  }

  let eventsRef = db.collection('events');
  let eventQuery = await eventsRef.where('date', '==', new Date(timeSlotDate)).get();

  if (!eventQuery.empty) {
    error = new ConflictError('The time slots cannot be created as it is already created for the given date');
  }
  return error;
}
