'use strict';
const express = require('express');

const api = express.Router();
const middleware = require('../middlewares/authenticated');

const opererioModel = require('../models/operario');

/**
 * Create a new operario
 */
api.post('/operario',  middleware.ensureAdminAuth, function(req, res) {
    const params = req.body;
    if (params.email !== undefined && params.lastname !== undefined && params.name !== undefined && params.phone !== undefined) {
        const operarioData = {
            email: params.email,
            lastname: params.lastname,
            name: params.name,
            phone: params.phone
        };
        opererioModel.addOperario(operarioData, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * ADMIN: Get all operarios
 */
api.get('/operario', middleware.ensureAdminAuth, function(req, res) {
    opererioModel.getAllOperario((error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: false, result: result});
    });
});

/**
 * ADMIN: Get operario by id
 */
api.get('/operarioById', middleware.ensureAdminAuth, function(req, res) {
    if (req.query.operario !== undefined) {
        opererioModel.getOperarioById(req.query.operario, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * ADMIN: update operario
 */
api.put('/operario', middleware.ensureAdminAuth, function(req, res) {
    const params = req.body;
    if (params.email !== undefined && params.name !== undefined && params.lastname !== undefined && params.phone !== undefined && params.operario !== undefined) {
        const operarioData = {
            uid: params.operario,
            email: params.email,
            name: params.name,
            lastname: params.lastname,
            phone: params.phone
        };
        opererioModel.updateOperario(operarioData, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * ADMIN: get operaris online
 */
api.get('/getOnlineOperaris', middleware.ensureAdminAuth, function (req, res) {
    opererioModel.getOnlineOperaris( (error, data) => {
        if (error === null) res.status(200).send({success: true, result: data});
        else res.status(error).send({success: false, result: data});
    });
});

/**
 * OPEARRI: Get operario by id
 */
api.get('/currentOperario', middleware.ensureAuth, function(req, res) {
    opererioModel.getCurrentOperario(req.uid, (error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: false, result: result});
    });
});
/**
 * OPERARIO: update last position & last position time
 */
api.put('/lastPosition', middleware.ensureAuth, function (req, res) {
    if (req.body.lat !== undefined && req.body.lon !== undefined) {
        const uploadData = {
            lat: req.body.lat,
            lon: req.body.lon,
            time: Date.now(),
            operario: req.uid
        };
        opererioModel.setLastPosition(uploadData, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});
module.exports = api;
