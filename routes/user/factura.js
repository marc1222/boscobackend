'use strict';

const config = require('../../config');
const api = config.getExpress();

const middleware = require('../../middlewares/user_auth');
const facturaModel = require('../../core/factura');




module.exports = api;
