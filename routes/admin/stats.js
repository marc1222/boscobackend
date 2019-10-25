'use strict';

const config = require('../../config');
const api = config.getExpress();
const statsModel = require('../../core/stats');

const middleware = require('../../middlewares/admin_auth');


api.get('/statsOperario', middleware.ensureAuth, function(req, res) {
    const operario = req.query.operario;
    if (operario !== undefined) {
        statsModel.getStatsByOperario(operario, (error, result) => {
            if (error) res.status(error).send({success: false, result: result});
            else res.status(200).send({success: true, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

api.get('/stats', middleware.ensureAuth, function(req, res) {
    statsModel.getAllStats((error, result) => {
        if (error) res.status(error).send({success: false, result: result});
        else res.status(200).send({success: true, result: result});
    });

});

module.exports = api;
