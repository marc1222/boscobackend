'use strict';

const config = require('../config');
const db = config.getDBConection();

var ORMservicioModel = {};

ORMservicioModel.getStatusServices = function(status, operarioUID, callback) {
    var allServices = [];
    db.collection('servicio').where('status', '==', status).where('operario', '==', operarioUID).get()
        .then( snapshot => {
            for (const doc in snapshot) {
                allServices.push({id: doc.id, data: doc.data()});
            }
            callback(null, allServices);
        }).catch( err => {
            callback(err.code, err);
        });
};

ORMservicioModel.fillPeriodsWithServicesData = function(references, periods, callback) {
    var allPeriods = periods;
    db.getAll.apply(db, references)
        .then (docs => {
            for (let i = 0; i < docs.length; ++i) {
                let service = {};
                const data = docs[i].data();
                service = {id: docs[i].id, data: data};
                if (data.period !== undefined) {
                    (allPeriods[data.period].services).push(service);
                }
            }
            callback(null, allPeriods);
        }).catch (err => {
            callback(500, err);
        });
};
/**
 * Get snapshot of facturation collection of an operario, where all closed services appear there
 * @param operarioID
 * @param max
 * @param callback
 */
ORMservicioModel.getFacturationSnapshot = function(operarioID, max, callback) {
    db.collection('operario').doc(operarioID).collection('facturacion').orderBy('order','desc').limit(Number(max)).get()
        .then( snapshot => {
            callback(null, snapshot);
        }).catch( err => {
            callback(err.code, err);
        });

};

// ORMservicioModel.updateOperario = function(serviceID, newOperario, callback) {
//     db.collection('servicio').doc(serviceID).update({
//         operario: newOperario
//     }).then( () => {
//         callback(null, "updated ok");
//     }).catch( err => {
//         callback(err.code, err);
//     });
// };
//
// ORMservicioModel.updateStatus = function(serviceID, newStatus, callback) {
//     db.collection('servicio').doc(serviceID).update({
//         status: newStatus
//     }).then( () => {
//         callback(null, "updated ok");
//     }).catch( err => {
//         callback(err.code, err);
//     });
// };

ORMservicioModel.getFacturationWeekRef = function(operarioID, week, callback) {
    db.collection('operario').doc(operarioID).collection('facturacion').doc(String(week)).get()
        .then(fact => {
            callback(null, fact);
        }).catch( err => {
            callback(err.code, err);
        });
};

module.exports = ORMservicioModel;