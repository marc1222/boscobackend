'use strict';
const express = require('express');

const api = express.Router();
const middleware = require('../middlewares/authenticated');
const facturaModel = require('../models/factura');


/**
 * Get all facturas
 */
api.get('/factura', middleware.ensureAdminAuth, function(req, res) {
    facturaModel.getAllFactura((error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: true, result: result});
    });
});

/**
 * ADMIN: Get factura by Id
 */
api.get('/facturaById', middleware.ensureAuth, function(req, res) {
    if (req.query.factura !== undefined) {
        facturaModel.getFacturaById(req.query.factura, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: true, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

module.exports = api;
