'use strict';

const config = require('../config');
const db = config.getDBConection();

var generalQueryModel = {};

generalQueryModel.getGenericDoc = function(collection, docID, callback) {
  db.collection(collection).doc(docID).get()
      .then( doc => {
          if (!doc.exists) callback(500, "No existe este documento");
          else callback(null, doc.data());
      }).catch(err => {
         callback(err.code, err);
      });
};

generalQueryModel.addGenericDoc = function(collection, docData, callback) {
  db.collection(collection).add(docData)
  .then( (result) => {
      callback(null, result.id);
  }).catch( err => {
      callback(err.code, err);
  });
};

generalQueryModel.getCollection = function(collection, callback) {
    var allDocs = [];
    db.collection(collection).get()
        .then(snapshot => {
            for (let doc in snapshot) {
                allDocs.push({id: doc.id, data: doc.data()});
            }
            callback(null, allDocs);
        }).catch(err => {
            callback(500, err);
        });
};

generalQueryModel.genericUpdate = function(collection, docID, updateData, callback) {
    db.collection(collection).doc(docID).update(updateData)
        .then( (res) => {
            callback(null, "updated ok");
        }).catch( err => {
            callback(err.code, err);
        });
};
/**
 * Get pointer to iterate a collection
 * @param collection
 * @param callback
 */
generalQueryModel.getCollectionSnapshot = function(collection, callback) {
  db.collection(collection).get()
      .then( snapshot => {
          callback(null, snapshot);
      }).catch( err => {
          callback(err.code, err);
      });
};

generalQueryModel.genericUpdateByReference = function(doc, updateData, callback) {
  doc.ref.update(updateData)
      .then (() => {
          callback(null, "updated ok");
      }).catch( err => {
          callback(err.code, err);
      });
};

generalQueryModel.genericSetByReference = function(doc, setData, callback) {
    doc.ref.set(setData)
        .then (() => {
            callback(null, "setted ok");
        }).catch( err => {
            callback(err.code, err);
        });
};




module.exports = generalQueryModel;