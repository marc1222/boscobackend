'use strict';

const db_tools = require("../utils/db");

const clienteModel = {};
/**
 * Add a client to firestore
 * @param facturaData
 * @param callback
 */
clienteModel.addFactura = (facturaData, callback) => {
	const db = db_tools.getDBConection();
	db.collection('factura').doc(facturaData.facturaID).set({
			cliente: facturaData.cliente,
			operario: facturaData.operario,
			service: facturaData.service,
			created_at: Date.now(),
			total: facturaData.total,
			pay: facturaData.pay,
			comision: facturaData.comision
	}).then(  result => {
		callback(null, "ok");
	}).catch(err => {
		callback(500, "error inserting: "+err);
	});
};
/**
 * Get all clients from firestore collection cliente
 * @param callback
 */
clienteModel.getAllFactura = (callback) => {
	const db = db_tools.getDBConection();
	var allFacturas = [];
	db.collection('factura').get()
		.then(snapshot => {
			snapshot.forEach(doc => {
				allFacturas.push({id: doc.id, data: doc.data()});
			});
			callback(null, allFacturas);
		}).catch(err => {
			callback(500, err);
		});
};

module.exports = clienteModel;
