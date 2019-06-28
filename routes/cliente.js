'use strict';
const express = require('express');

const api = express.Router();
const middleware = require('../middlewares/authenticated');

const clienteModel = require('../models/cliente');

/**
 * Create a new client
 */
api.post('/cliente',  middleware.ensureAdminAuth, function(req, res) {
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
           else res.status(error).send({success: true, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Get all clientes
 */
api.get('/cliente', middleware.ensureAdminAuth, function(req, res) {
    clienteModel.getAllCliente((error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: true, result: result});
    });
});

api.put('/cliente', middleware.ensureAdminAuth, function(req, res) {
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
