'use strict';

const db_tools = require("../utils/db");

const facturaModel = {};
/**
 * Add a client to firestore
 * @param facturaData
 * @param callback
 */
facturaModel.addFactura = (facturaData, callback) => {
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
facturaModel.getAllFactura = (callback) => {
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

/**
 * Get factura by ID
 * @param factura
 * @param callback
 */
facturaModel.getFacturaById = (factura, callback) => {
	const db = db_tools.getDBConection();
	const factPromise = new Promise((resolve, reject) => {
		db.collection('factura').doc(factura).get()
			.then(fact => {
				if (!fact.exists) callback(500, "No document found");
				else {
					resolve(fact.data());
				}
			}).catch(err => {
				reject(err);
			});
	});
	const servPromise = new Promise((resolve, reject) => {
		db.collection('servicio').doc(factura).get()
			.then(serv => {
				if (!serv.exists) callback(500, "No document found");
				else {
					resolve(serv.data());
				}
			}).catch(err => {
				reject(err);
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
