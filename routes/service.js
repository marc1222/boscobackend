'use strict';
const express = require('express');
const api = express.Router();

const serviceModel = require('../models/service');
const facturaModel = require('../models/factura');
const middleware = require('../middlewares/authenticated');

const multipart = require('connect-multiparty');
const md_upload = multipart({uploadDir: './uploads/service'});
/**
 ******************************** GETTERS ********************************
 */

/**
 * ADMIN: Get all services
 */
api.get('/service', middleware.ensureAdminAuth, function(req, res) {
	serviceModel.getAllService((error, result) => {
		if (error === null) res.status(200).send({success: true, result: result});
		else res.status(error).send({success: true, result: result});
	});
});

/**
 *	OPERARIO: Get alerts by User ID
 */
api.get('/alertsUser', middleware.ensureAuth, function(req, res) {
	serviceModel.getAlerts(req.uid, (error, result ) => {
		if (error === null) {
			res.status(200).send({success: true, result: result});
		}
		else {
			res.status(error).send({success: false, result: result});
		}
	});
});

/**
 *	OPERARIO: Get open services by User ID
 */
api.get('/serviceOpenUser', middleware.ensureAuth, function(req, res) {
	serviceModel.getserviceOpen(req.uid, (error, result ) => {
		if (error === null) {
			res.status(200).send({success: true, result: result});
		}
		else res.status(error).send({success: false, result: result});
	});
});
//
// /**
// *	Get closed services by User ID
// */
// api.get('/serviceCloseUser', function(req, res) {
// 	const token = req.header('token');
// 	if (token !== undefined) {
// 		auth.validateToken(token, (error, data) => { //on data.result on success = user uid
// 			if (error === null) {
// 				serviceModel.getserviceClose(data, (error, result ) => {
// 					if (error === null) {
// 						  res.status(200).send({success: true, result: result});
// 					}
// 					else res.status(error).send({success: false, result: result});
// 				});
// 			} else {
// 				 res.status(400).send({success: false, result: data});
// 			}
// 		});
// 	} else res.status(400).send({success: false, result: "No token"});
// });
/**
 * OPERARIO
 */
api.get('/downloadServiceOperario', middleware.ensureAuth, function (req, res) {
	const name = req.query.name;
	if (name !== undefined) {
		serviceModel.downlaodFromServiceGCS(name, (error, data) => {
			if (error === null) res.status(200).send({success: true, result: data});
			else res.status(error).send({success: false, result: data});
		});
	}
});
/**
 * ADMIN
 */
api.get('/downloadServiceAdmin', middleware.ensureAdminAuth, function (req, res) {
	const name = req.query.name;
	if (name !== undefined) {
		serviceModel.downlaodFromServiceGCS(name, (error, data) => {
			if (error === null) res.status(200).send({success: true, result: data});
			else res.status(error).send({success: false, result: data});
		});
	}
});


/**
 * *************************** POSTS *******************************
 */

/**
 * ADMIN: Creates a new service
 */
api.post('/service',  middleware.ensureAdminAuth, function(req, res) {
	const params = req.body;
	if (params.address !== undefined && params.budget !== undefined && params.cliente !== undefined && params.note !== undefined && params.priority !== undefined
		&& params.title !== undefined && params.type !== undefined && params.operario !== undefined && params.isBudget !== undefined) {
		let scheduled_date = '';
		if (params.scheduled_date !== undefined) scheduled_date = params.scheduled_date;
		const serviceData = {
			address: params.address,
			budget: params.budget,
			cliente: params.cliente,
			note: params.note,
			priority: params.priority,
			title: params.title,
			type: params.type,
			operario: params.operario,
			scheduled_date: scheduled_date,
			isBudget: params.isBudget
		};
		serviceModel.addService(serviceData, (error, result) => {
			if (error === null) res.status(200).send({success: true, result: "inserted correctly"});
			else res.status(error).send({success: true, result: result});
		});
	} else res.status(400).send({success: false, result: "Bad request"});
});


/**
 ******************************** UPDATES *******************************
 */

/**
 *	OPERARIO: Accept service by Service ID
 */
api.put('/serviceAccept',  middleware.ensureAuth, function(req, res) {
	const service = req.body.service;
	if (service !== undefined) {
		const params = {
			service: service,
			uid: req.uid
		};
		serviceModel.serviceAccept(params, (error, result ) => {
			if (error === null) {
				res.status(200).send({success: true, result: result});
			}
			else res.status(error).send({success:false, result: result});
		});
	} else  {
		res.status(500).send({success: false, result: "No service"});
	}
});

/**
 *	OPERARIO: Deny service by Service ID
 */
api.put('/serviceDeny', middleware.ensureAuth, function(req, res) {
	const service = req.body.service;
	if (service !== undefined) {
		const params = {
			service: service,
			uid: req.uid
		};
		serviceModel.serviceDeny(params, (error, result ) => {
			if (error === null) {
				res.status(200).send({success: true, result: result});
			}
			else res.status(error).send({success:false, result: result});
		});
	} else {
		res.status(500).send({success: false, result: "No service"});
	}
});

/**
 *	OPERARIO: End service by Service ID
 */
api.put('/serviceEnd', middleware.ensureAuth, function(req, res) {
	const service = req.body.service;
	if (service !== undefined) {
		const params = {
			service: service,
			uid: req.uid
		};
		serviceModel.serviceEnd(params, (error, result ) => {
			if (error === null) {
				//si tot be creem la factura per aquest servei -> suposem que el budget ha estat correctament setejat
				const comisionpart = 0.2;
				const clean = (result.total_price-result.costs_price);
				const facturaData = {
					cliente: result.cliente,
					operario: result.operario,
					service: params.service,
					created_at: Date.now(),
					total: result.total_price,
					pay: clean*(1-comisionpart),
					comision: clean*comisionpart
				};
				facturaModel.addFactura(facturaData, (error, result) => {
					if (error === null) res.status(200).send({success: true, result: result});
					else res.status(500).send({success: false, result: "service ended correctly but factura creation has failed"});
				});
			}
			else res.status(error).send({success:false, result: result});
		});
	} else {
		res.status(500).send({success: false, result: "No service"});
	}
});

/**
 * OPERARIO: Register new budget for a specified service, called by operario
 */
api.put('/registerBudget', middleware.ensureAuth, function(req, res) {
	const params = req.body;
	if (params.total_price !== undefined && params.costs_price !== undefined && params.service !== undefined) {
		const budgetData = {
			uid: req.uid,
			total_price: params.total_price,
			costs_price: params.costs_price,
		};
		serviceModel.setBudget(params.service, budgetData, (error, result) => {
				if (error === null) res.status(200).send({success: true, result: result});
				else res.status(error).send({success: false, result: result});
		});
	} else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * OPERARIO: upload multiple files operario
 */
api.put('/uploadServiceOperario', [middleware.ensureAuth, md_upload], function (req, res) {
	if (req.files && req.body.service !== undefined && req.body.files !== undefined) {
		const uploadData = {
			service: req.body.service,
			uid: req.uid,
			uploadNumber: req.body.files
		};
		serviceModel.uploadToServiceGCS(req.files, uploadData, (error, data) => {
			if (error === null) res.status(200).send({success: true, result: data});
			else res.status(error).send({success: false, result: data});
		});
	}
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
		serviceModel.setLastPosition(uploadData, (error, data) => {
			if (error === null) res.status(200).send({success: true, result: data});
			else res.status(error).send({success: false, result: data});
		});
	}
});
module.exports = api;