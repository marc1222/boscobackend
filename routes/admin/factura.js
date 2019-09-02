'use strict';

const config = require('../../config');
const api = config.getExpress();

const middleware = require('../../middlewares/admin_auth');
const facturaModel = require('../../core/factura');


/**
 * Get all facturas admin call
 */
api.get('/factura', middleware.ensureAuth, function(req, res) {
    facturaModel.getAllFactura((error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: true, result: result});
    });
});

/**
 * Get factura by Id
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
