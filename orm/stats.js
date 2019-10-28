'use strict';

const config = require('../config');
const db = config.getDBConection();
const constant = require("../utils/define");

var statsQueryModel = {};

statsQueryModel.addDoc2Stats = function(statsCollection, operario, insertData, callback) {
      db.collection('stats').doc(operario).collection(statsCollection).add((insertData))
          .then( () => {
              callback(null, "ok");
          }).catch((err) => {
              callback(err.code, err);
          });
};

statsQueryModel.getStatsOperario = function(operarioID, callback) {

    let serviceStats = new Promise ((resolve, reject) => {
        db.collection('stats').doc(operarioID).collection('servicio').get()
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
        db.collection('stats').doc(operarioID).collection('factura').get()
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

};

module.exports = statsQueryModel;
