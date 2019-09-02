'use strict';

const config = require('../config');
const db = config.getDBConection();

var ORMoperarioModel = {};

ORMoperarioModel.addOperario = function(operarioData, operarioID, callback) {
    db.collection('operario').doc(operarioID).set(operarioData)
        .then(  result => {
        callback(null, "added ok");
        }).catch(err => {
            callback(err.code, err);
        });
};

ORMoperarioModel.updatePosition = function(lastPosition, docID, callback) {
    db.collection('operario').doc(docID).update({
        lastPositionData: lastPosition
    }).then( () => {
        callback(null, "updated ok");
    }).catch( err => {
        callback(err.code, err);
    });
};


module.exports = ORMoperarioModel;