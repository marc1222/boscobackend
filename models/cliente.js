'use strict';

const db_tools = require("../utils/db");

const clienteModel = {};
/**
 * Add a client to firestore
 * @param clientData
 * @param callback
 */
clienteModel.addCliente = (clientData, callback) => {
	const db = db_tools.getDBConection();
	const randomHex = require('random-hex');

	db.collection('cliente').add({
			address: clientData.address,
			cp: clientData.cp,
			lastname: clientData.lastname,
			nombre: clientData.nombre,
			phone: clientData.phone,
			email: clientData.email,
			color: 	randomHex.generate()
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
clienteModel.getAllCliente = (callback) => {
	const db = db_tools.getDBConection();
	var allClients = [];
	db.collection('cliente').get()
		.then(snapshot => {
			snapshot.forEach(doc => {
				allClients.push({id: doc.id, data: doc.data()});
			});
			callback(null, allClients);
		}).catch(err => {
			callback(500, err);
		});
};

clienteModel.updateCliente = (clienteData, callback) => {
    const db = db_tools.getDBConection();
    db.collection('cliente').doc(clienteData.document).get()
        .then( doc => {
            doc.ref.update({
                address: clienteData.address,
                cp: clienteData.cp,
                lastname: clienteData.lastname,
                nombre: clienteData.nombre,
                phone: clienteData.phone,
				email: clientData.email
            })
                .then(result => {
                    callback(null, "updated ok");
                }).catch(err => {
                callback(500, "error while updating...");
            });
        }).catch( err => {
        callback(500, err );
    });
};

module.exports = clienteModel;
