'use strict';

const config = require('../config');
const db = config.getDBConection();
const constant = require("../utils/define");

var ORMservicioModel = {};

ORMservicioModel.getStatusServices = function(status, operarioUID, callback) {
    var allServices = [];
    db.collection(constant.ServicioCollection).where('status', '==', status).where('operario', '==', operarioUID).get()
        .then( snapshot => {
            const docs = snapshot._docs();
            for (const doc of docs) {
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
    db.collection(constant.OperarioCollection).doc(operarioID).collection(constant.FacturacionCollection).orderBy('order','desc').limit(Number(max)).get()
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
    db.collection(constant.OperarioCollection).doc(operarioID).collection(constant.FacturacionCollection).doc(String(week)).get()
        .then(fact => {
            callback(null, fact);
        }).catch( err => {
            callback(err.code, err);
        });
};

ORMservicioModel.getServicesWithNames = function(callback) {
    db.collection(constant.ServicioCollection).get()
        .then( snapshot => {
           var allServices = {};
           var allOperario = [];
           var allClient = [];
           const docs = snapshot._docs();
           for (let i = 0; i < docs.length; ++i) {
                const doc = docs[i];
                const data =  doc.data();
                allServices[doc.id] = {};
                allServices[doc.id] = data;
                if (data.operario !== constant.NullOperario && data.operario !== "nulloperario" && data.operario !== "nuloperario" && data.operario !== undefined) {
                    let operario = db.collection(constant.OperarioCollection).doc(data.operario);
                    allOperario.push(operario);
                }
                if (data.cliente !== undefined) {
                    let client = db.collection(constant.ClientCollection).doc(data.cliente);
                    allClient.push(client);
                }
            }
            let clientPromise = new Promise((resolve, reject)  => {
                db.getAll.apply(db, allClient)
                    .then (docs => {
                        var mappedClients = {};
                        for (let i = 0; i < docs.length; ++i) {
                            const cliDoc = docs[i];
                            mappedClients[cliDoc.id] = cliDoc.data().nombre;
                        }
                        resolve(mappedClients);
                    }).catch(err => {
                        reject(err);
                    });
            });
            let operarioPromise = new Promise((resolve, reject)  => {
                db.getAll.apply(db, allOperario)
                    .then (docs => {
                        var mappedOperario = {};
                        for (let i = 0; i < docs.length; ++i) {
                            const opDoc = docs[i];
                            mappedOperario[String(opDoc.id)] = opDoc.data().nombre;
                        }
                        resolve(mappedOperario);
                    }).catch(err => {
                        reject(err);
                    });
            });

            let promises = [clientPromise, operarioPromise];
            Promise.all(promises)
            .then(resolved => {
                const client = resolved[0];
                const operario = resolved[1];
                for (let service in allServices) {
                    if (service.operario !== constant.NullOperario && service.operario !== "nulloperario" && service.operario !== "nuloperario") allServices[service].OpNombre = operario[allServices[service].operario]; //or there is an operario or value is nulloperario
                    allServices[service].CliNombre = client[allServices[service].cliente]; //always there is a client
                }
                console.log(allServices);
                callback(null, allServices);
            }).catch(err => {
                console.log(err);
                callback(500, err);
            });
        }).catch( err => {
            callback(500, err);
        });
};

module.exports = ORMservicioModel;
