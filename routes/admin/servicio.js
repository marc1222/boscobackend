'use strict';

const config = require('../../config');
const api = config.getExpress();
const serviceModel = require('../../core/servicio');

const middleware = require('../../middlewares/admin_auth');
//const facturaModel = require('../../core/factura');

//--------------------------------------------------------------------------//
/**
 * Admin call that Get all Services
 * Params required: -
 */
api.get('/service', middleware.ensureAuth, function(req, res) {
	serviceModel.getAllService((error, result) => {
		if (error) res.status(error).send({success: false, result: result});
		else res.status(200).send({success: true, result: result});
	});
});

/**
 * Admin call that Get Service by ID
 * Params required: service ID
 */
api.get('/serviceById', middleware.ensureAuth, function(req, res) {
	if (req.query.service !== undefined) {
		serviceModel.getServiceById(req.query.service, (error, result) => {
			if (error === null) res.status(200).send({success: true, result: result});
			else res.status(error).send({success: false, result: result});
		});
	} else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Admin call that retrieves all services closed by an operario
 * Params required: min, max, operario UID
 */
api.get('/serviceAdminCloseUser', middleware.ensureAuth ,function(req, res) {
	const limitData = {
		max: req.query.max,
		min: req.query.min
	};
	if (req.query.max !== undefined && req.query.min !== undefined && limitData.min < limitData.max && req.query.operario !== undefined) {
		serviceModel.getserviceClose(req.query.operario, limitData, (error, result ) => {
			if (error === null) res.status(200).send({success: true, result: result});
			else res.status(error).send({success: false, result: result});
		});
	} else res.status(400).send({success: false, result: "Bad request"});

});

/**
 * Admin call to download  a document from /service/ on google storage
 */
api.get('/downloadServiceAdmin', middleware.ensureAuth, function (req, res) {
	const name = req.query.name;
	if (name !== undefined) {
		serviceModel.downlaodFromServiceGCS(name, (error, data) => {
			if (error === null) res.status(200).send({success: true, result: data});
			else res.status(error).send({success: false, result: data});
		});
	} else res.status(400).send({success: false, result: "Bad request"});
});

//--------------------------------------------------------------------------//

/**
 * Admin call that Creates a new service
 * Required params: address, budget, cliente, note, priority, title, type, operario, isBudget
 */
api.post('/service',  middleware.ensureAuth, function(req, res) {
	const params = req.body;
	if (params.address !== undefined && params.budget !== undefined && params.cliente !== undefined && params.note !== undefined && params.priority !== undefined
		&& params.title !== undefined && params.coordX !== undefined && params.coordY !== undefined && params.type !== undefined && params.operario !== undefined && params.isBudget !== undefined) {
		let scheduled_date = '';
		if (params.scheduled_date !== undefined) scheduled_date = params.scheduled_date;
		const serviceData = {
			address: params.address,
			coordX: params.coordX,
			coordY: params.coordY,
			budget: params.budget,
			cliente: params.cliente,
			noteAdmin: params.noteAdmin,
			priority: params.priority,
			title: params.title,
			type: params.type,
			operario: params.operario,
			scheduled_date: scheduled_date,
			isBudget: params.isBudget
		};
		serviceModel.addService(serviceData, (error, result) => {
			if (error === null) res.status(200).send({success: true, result: result});
			else res.status(error).send({success: true, result: result});
		});
	} else res.status(400).send({success: false, result: "Bad request"});
});

//--------------------------------------------------------------------------//

/**
 * Admin call to Reasign service to another operario
 * Required params: service UID, new operario to reasign service UID (operario)
*/
api.put('/reasignService', middleware.ensureAuth, function (req, res) {
   if (req.body.service !== undefined && req.body.operario !== undefined) {
        const reasignData = {
            service: req.body.service,
            newOperario: req.body.operario
        };
        serviceModel.reasignService(reasignData, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
   } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Admin call to mark that an operario has payed a period
 * Required params: period ID to pay, operario UID
 */
api.put('payPeriod', middleware.ensureAuth, function(req, res) {
	if (req.body.periode !== undefined && req.body.operario !== undefined) {
		const periodData = {
			periode: req.body.periode,
			operario: req.body.operario
		};
		serviceModel.payPeriod(periodData, (error, result) => {
			if (error === null) res.status(200).send({success: true, result: result});
			else res.status(error).send({success: false, result: result});
		});
	} else res.status(400).send({success: false, result: "Bad request"});
});

module.exports = api;
