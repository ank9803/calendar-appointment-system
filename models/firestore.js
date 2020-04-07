'use strict';

let db;

const setFirestoreDb = (firestoreDb) => {
  db = firestoreDb;
};

const getFirestoreDb = () => {
  return db;
};

module.exports = {
  setFirestoreDb,
  getFirestoreDb
};