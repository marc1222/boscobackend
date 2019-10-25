'use strict';

const config = require('../config');
const db = config.getDBConection();

var statsQueryModel = {};

statsQueryModel.addDoc2Stats = function(statsCollection, operario, insertData, callback) {

      db.collection('stats').doc(operario).collection(statsCollection).add(insertdata)
          .then( () => {
              callback(null, "ok");
          }).catch((err) => {
              callback(err.code, err);
          });
};

statsQueryModel.getStatsOperario = function(operarioID, callback) {
    db.collection('stats').doc(operarioID).get()
        .then( doc => {
            if (!doc.exists) callback(500, "operario not exists");
            else {
                let serviceStats = new Promise ((resolve, reject) => {
                    doc.ref.collection('servicio').get()
                        .then( snapshotService => {
                            const docs = snapshotService._docs();
                            var stats = [];
                            for (let i = 0; i < docs.length; ++i) {
                                stats.push(docs[i].data());
                            }
                            resolve(stats);
                        }).catch(err => {
                            reject(err);
                        });
                });

                let facturaStats = new Promise ((resolve, reject) => {
                        doc.ref.collection('factura').get()
                            .then( snapshotService => {
                                const docs = snapshotService._docs();
                                var stats = [];
                                for (let i = 0; i < docs.length; ++i) {
                                    stats.push(docs[i].data());
                                }
                                resolve(stats);
                            }).catch(err => {
                            reject(err);
                        });
                });
                const promises = [serviceStats, facturaStats];
                Promise.all(promises)
                    .then( resolved => {
                        callback(null, {
                           serviceStats: resolved[0],
                           facturaStats: resolved[1]
                        });
                    }).catch( err => {
                        callback(500, err);
                    });

            }
        }).catch( err => {
            callback(err.code, err);
        });
};

module.exports = statsQueryModel;
