'use strict';

const config = require('../../config');
const api = config.getExpress();

const middleware = require('../../middlewares/admin_auth');

const operarioModel = require('../../core/operario');

/**
 * Admin call to create a new operario
 * Required params: email, lastname, name, phone
 */
api.post('/operario',  middleware.ensureAuth, function(req, res) {
    const params = req.body;
    if (params.email !== undefined && params.lastname !== undefined && params.name !== undefined && params.phone !== undefined) {
        const operarioData = {
            email: params.email,
            lastname: params.lastname,
            name: params.name,
            phone: params.phone
        };
        operarioModel.addOperario(operarioData, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Admin call to get ALL operarios
 * Required params: -
 */
api.get('/operario', middleware.ensureAuth, function(req, res) {
    operarioModel.getAllOperario(req.query.active,(error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: false, result: result});
    });

});

/**
 * Admin call to get operario using UID
 * Required params: operario UID
 */
api.get('/operarioById', middleware.ensureAuth, function(req, res) {
    if (req.query.operario !== undefined) {
        operarioModel.getOperarioById(req.query.operario, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Admin call to update an operario
 * Required params: email, name, lastname, phone, operario UID
 */
api.put('/operario', middleware.ensureAuth, function(req, res) {
    const params = req.body;
    if (params.email !== undefined && params.name !== undefined && params.lastname !== undefined && params.phone !== undefined && params.operario !== undefined) {
        const operarioData = {
            uid: params.operario,
            email: params.email,
            name: params.name,
            lastname: params.lastname,
            phone: params.phone
        };
        operarioModel.updateOperario(operarioData, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Admin call to get all online operarios
 * Required params: -
 */
api.get('/getOnlineOperaris', middleware.ensureAuth, function (req, res) {
    operarioModel.getOnlineOperaris( (error, data) => {
        if (error === null) res.status(200).send({success: true, result: data});
        else res.status(error).send({success: false, result: data});
    });
});


api.post('/bajaOperario', middleware.ensureAuth, function (req, res) {
    const operario = req.body.operario;
    if (operario !== undefined) {
        operarioModel.unsubscribeOperario(operario, (error, data) => {
            if (error) res.status(error).send({success: false, result: data});
            else res.status(200).send({success: true, result: data});
        });
    } else res.status(400).send({success: false, result: "Bad request"});

});

module.exports = api;
