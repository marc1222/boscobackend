'use strict';

const db_tools = require("../config");

const db_general = require('../orm/general_model');

const facturaModel = {};
/**
 * Add a client to firestore
 * @param facturaData
 * @param callback
 */
facturaModel.addFactura = (facturaData, callback) => {
	const NewFactura = {
		cliente: facturaData.cliente,
		operario: facturaData.operario,
		service: facturaData.service,
		created_at: Date.now(),
		total: facturaData.total,
		pay: facturaData.pay,
		comision: facturaData.comision
	};
	db_general.addGenericDoc('factura', NewFactura, (error, result) => {
		if (error) callback(error, result);
		else callback(null, "added doc id: "+result);
	});
};
/**
 * Get all clients from firestore collection cliente
 * @param callback
 */
facturaModel.getAllFactura = (callback) => {
	db_general.getCollection('factura', (error, result) => {
		if (error) callback(error, result);
		else callback(null, result);
	});
};

/**
 * Get factura by ID & servicio that is mapping
 * @param factura
 * @param callback
 */
facturaModel.getFacturaById = (factura, callback) => {
	const factPromise = new Promise((resolve, reject) => {
		db_general.getGenericDoc('factura', factura, (error, result) => {
			if (error) reject(result);
			else resolve(result);
		});
	});
	const servPromise = new Promise((resolve, reject) => {
		db_general.getGenericDoc('servicio', factura, (error, result) => {
			if (error) reject(result);
			else resolve(result);
		});
	});
	const promises = [factPromise, servPromise];
	Promise.all(promises)
		.then( () => {
			callback(null, {
				factura: promises[0],
				servicio: promises[1]
			});
		}).catch( err => {
			callback(500, err);
		});
};

module.exports = facturaModel;
