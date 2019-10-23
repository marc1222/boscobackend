'use strict';

const config = require('../config');
const db = config.getDBConection();

var statsQueryModel = {};

statsQueryModel.addDoc2Stats = function(statsCollection, operario, insertData, callback) {

      db.collection(statsCollection).doc(operario).collection('stats').add(insertdata)
          .then( () => {
              callback(null, "ok");
          }).catch((err) => {
              callback(err.code, err);
          });
};

module.exports = statsQueryModel;
