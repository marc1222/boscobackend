'use strict';

const config = require('../../config');
const api = config.getExpress();

const middleware = require('../../middlewares/admin_auth');
const clienteModel = require('../../core/cliente');

//--------------------------------------------------------------------------//

/**
 * Admin call to get ALL clients
 * Required params: -
 */
api.get('/cliente', middleware.ensureAuth, function(req, res) {
    clienteModel.getAllCliente((error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: false, result: result});
    });
});

/**
 * Admin call to get client by UID
* Required params: client UID
*/
api.get('/clienteById', middleware.ensureAuth, function(req, res) {
    if (req.query.cliente !== undefined) {
        clienteModel.getClienteById(req.query.cliente, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

//--------------------------------------------------------------------------//

/**
 * Admin call to create a new client
 * Required params: email, address, cp (postal code), lastname, name
 */
api.post('/cliente',  middleware.ensureAuth, function(req, res) {
    const params = req.body;
    if (params.email !== undefined && params.address !== undefined && params.cp !== undefined && params.lastname !== undefined && params.nombre !== undefined && params.phone !== undefined) {
        const clientData = {
            address: params.address,
            cp: params.cp,
            lastname: params.lastname,
            nombre: params.nombre,
            phone: params.phone,
            email: params.email
        };
        clienteModel.addCliente(clientData, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: "inserted correctly"});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

//--------------------------------------------------------------------------//

/**
 * Admin call to update a new client
 * Required params: email, address, cp (postal code), lastname, nombre
 */
api.put('/cliente', middleware.ensureAuth, function(req, res) {
    const params = req.body;
    if (params.email !== undefined && params.address !== undefined && params.cp !== undefined && params.nombre !== undefined && params.lastname !== undefined && params.phone !== undefined && params.cliente !== undefined) {
        const clienteData = {
            document: params.cliente,
            address: params.address,
            nombre: params.nombre,
            lastname: params.lastname,
            phone: params.phone,
            cp: params.cp,
            email: params.email
        };
        clienteModel.updateCliente(clienteData, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

module.exports = api;
