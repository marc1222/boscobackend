'use strict';

const config = require('../../config');
const api = config.getExpress();

const middleware = require('../../middlewares/user_auth');
const operarioModel = require('../../core/operario');

/**
 * Operario call to get current operario requesting for his information
 * Required params: -
 */
api.get('/currentOperario', middleware.ensureAuth, function(req, res) {
    operarioModel.getOperarioById(req.uid, (error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: false, result: result});
    });
});
/**
 * Operario call to update last position & last position time (well-known)
 * Required params: latitude (lat), longitude (lon)
 */
api.put('/lastPosition', middleware.ensureAuth, function (req, res) {
    if (req.body.lat !== undefined && req.body.lon !== undefined) {
        const uploadData = {
            lat: req.body.lat,
            lon: req.body.lon,
            time: Date.now(),
            operario: req.uid
        };
        operarioModel.setLastPosition(uploadData, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});
module.exports = api;
