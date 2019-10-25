'use strict';

const db_general = require('../orm/general_model');
const db_stats = require('../orm/stats');

const statsModel = {};

statsModel.addServicioStat = function(statsData) {

    const NewStat = {
        event: statsData.event,
        date: statsData.date
    };
    db_stats.addDoc2Stats('servicio', statsData.operario, NewStat, (error, result) => {
        if (error) console.log("Error saving SERVICIO stats!!!");
    });
};

statsModel.addFacturaStat = function(statsData) {

    const NewStat = {
        total: statsData.total,
        material: statsData.material,
        date: statsData.date
    };
    db_stats.addDoc2Stats('factura', statsData.operario, NewStat, (error, result) => {
            if (error) console.log("Error saving FACTURA stats!!!");
    });
};

statsModel.getStatsByOperario = function(operarioID, callback) {
    db_stats.getStatsOperario(operarioID, (error, result) => {
        if (error) callback(error, result);
        else callback(null, result);
    });
};
statsModel.getAllStats = function(callback) {
    db_general.getCollectionSnapshot('stats', (error, snapshot) => {
       if (error) callback(error, snapshot);
       else {
            const docs = snapshot._docs();
            var serviceStats = [];
            var facturaStats = [];
            const promises = [];
            for (let i = 0; i < docs.length; ++i) {
                let promise = new Promise ((resolve, reject) => {
                    const operario = docs[i].id;
                    db_stats.getStatsOperario(operario, (error, result) => {
                        if (error) callback(error, result);
                        else resolve(result);
                    });
                });
                promises.push(promise);
            }

            Promise.all(promises)
                .then(resolved => {
                    for (let i = 0; i < resolved.length; ++i) {
                        console.log(resolved[i]);
                        const operarioStatsService =  resolved[i].serviceStats;
                        serviceStats = serviceStats.concat(operarioStatsService);
                        const operarioStatsFactura =  resolved[i].facturaStats;
                        facturaStats = facturaStats.concat(operarioStatsFactura);
                    }
                    callback(null, {
                        serviceStats: serviceStats,
                        facturaStats: facturaStats
                    });
                }).catch( err => {
                   callback(err.code, err);
                });
       }
    });
};

module.exports = statsModel;
