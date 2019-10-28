'use strict';

const config = require('../../config');
const api = config.getExpress();

const middleware = require('../../middlewares/user_auth');
const serviceModel = require('../../core/servicio');
const facturaModel = require('../../core/factura');

const multipart = require('connect-multiparty');
const md_upload = multipart({uploadDir: './uploads/service'});

//--------------------------------------------------------------------------//

/**
 *	Operario call to Get ALERTS by User ID
 *	Required params: -
 */
api.get('/alertsUser', middleware.ensureAuth, function(req, res) {
	serviceModel.getAlerts(req.uid, (error, result ) => {
		if (error === null) {
			res.status(200).send({success: true, result: result});
		}
		else res.status(error).send({success: false, result: result});
	});
});

/**
 *	Operario call to Get OPEN services by operario ID
 *	Required params: -
 */
api.get('/serviceOpenUser', middleware.ensureAuth, function(req, res) {
	serviceModel.getServiceOpen(req.uid, (error, result ) => {
		if (error === null) {
			res.status(200).send({success: true, result: result});
		}
		else res.status(error).send({success: false, result: result});
	});
});

/**
 *	Operario call to Get CLOSED services by operario ID
 *	Required params: min & max (periods)
 */
api.get('/serviceCloseUser', middleware.ensureAuth ,function(req, res) {
    const limitData = {
        max: req.query.max,
        min: req.query.min
    };
	if (req.query.max !== undefined && req.query.min !== undefined && limitData.min < limitData.max) {
		serviceModel.getserviceClose(req.uid, limitData, (error, result ) => {
			if (error === null) res.status(200).send({success: true, result: result});
			else res.status(error).send({success: false, result: result});
		});
	} else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Operario call to download a document from /service/ folder from google storage
 * Required parmas: image name
 */
api.get('/downloadServiceOperario', middleware.ensureAuth, function (req, res) {
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
 *	Operario call that ACCEPT service by Service ID
 *	Required params: service UID
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
		res.status(500).send({success: false, result: "Bad request"});
	}
});

/**
 *	Operario call that DENY service by Service ID
 *	Required params: service UID
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
 *	Operario call that ENDS service by Service ID
 *	Required params: service UID, nota
 */
api.put('/serviceEnd', middleware.ensureAuth, function(req, res) {
	const service = req.body.service;
	const note = req.body.noteOperario;
	if (service !== undefined &&  note !== undefined) {
		const params = {
			service: service,
			uid: req.uid,
			noteOperario: note
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
					comision: clean*comisionpart,
					facturaID: service
				};
				facturaModel.addFactura(facturaData, (error, result) => {
					if (error === null) res.status(200).send({success: true, result: result});
					else res.status(error).send({success: false, result: "service ended correctly but factura creation has failed"});
				});
			}
			else res.status(error).send({success:false, result: result});
		});
	} else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Operario call that Register a new budget for a specified service
 * Required params: total_price, costs_price, service UID
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
 * Operario call to upload N files to /service/ folder from google storage
 * Required params: files to upload (imagen_0, imagen_1, ...), service UID, number of files to upload
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
	} else res.status(400).send({success: false, result: "Bad request"});
});

api.put('/rejectService', middleware.ensureAuth, (req, res) => {
	const service = req.body.service;
	if (service !== undefined) {
		const reasignData = {
			service: service,
			newOperario: 'nulloperari',
			motivoAnulacion: req.body.motivoAnulacion
		};
		serviceModel.reasignService(reasignData, (error, result) => {
			if (error === null) res.status(200).send({success: true, result: result});
			else res.status(error).send({success: false, result: result});
		});
	} else res.status(400).send({success: false, result: "Bad request"});
});
module.exports = api;
