'use strict';

const config = require('../config');
const db = config.getDBConection();
const constant = require("../utils/define");

var ORMoperarioModel = {};

ORMoperarioModel.addOperario = function(operarioData, operarioID, callback) {
    db.collection(constant.OperarioCollection).doc(operarioID).set(operarioData)
        .then(  result => {
        callback(null, "added ok");
        }).catch(err => {
            callback(err.code, err);
        });
};

ORMoperarioModel.updatePosition = function(lastPosition, docID, callback) {
    db.collection(constant.OperarioCollection).doc(docID).update({
        lastPositionData: lastPosition
    }).then( () => {
        callback(null, "updated ok");
    }).catch( err => {
        callback(err.code, err);
    });
};


module.exports = ORMoperarioModel;
