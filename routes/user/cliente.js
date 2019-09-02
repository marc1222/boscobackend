'use strict';

const config = require('../../config');
const api = config.getExpress();

const middleware = require('../../middlewares/user_auth');
const clienteModel = require('../../core/cliente');

//--------------------------------------------------------------------------//
/**
 * Operario call to know the minimum info needed to fill client fields on operario app
 * Required params: cliente UID
*/
api.get('/shortClienteById', middleware.ensureAuth, function(req, res) {
    if (req.query.cliente !== undefined) {
        clienteModel.getShortClienteById(req.query.cliente, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

module.exports = api;
