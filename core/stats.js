'use strict';

const db_general = require('../orm/general_model');
const db_stats = require('../orm/stats');

const statsModel = {};

statsModel.addServicioStat = function(statsData) {

    const NewStat = {
        event: statsData.event,
        date: statsData.date
    };
    db_stats.addDoc2Stats('servicio_stats', statsData.operario, NewStat, (error, result) => {
        if (error) console.log("Error saving SERVICIO stats!!!");
    });
};

statsModel.addFacturaStat = function(statsData) {

    const NewStat = {
        total: statsData.total,
        material: statsData.material,
        date: statsData.date
    };
    db_stats.addDoc2Stats('factura_stats', statsData.operario, NewStat, (error, result) => {
            if (error) console.log("Error saving FACTURA stats!!!");
    });
};

module.exports = statsModel;
