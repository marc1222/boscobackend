'use strict';

const db_general = require('../orm/general_model');

const clienteModel = {};
/**
 * Add a client to firestore
 * @param clientData
 * @param callback
 */
clienteModel.addCliente = (clientData, callback) => {
	const randomHex = require('random-hex');
	const NewClient = {
		address: clientData.address,
		cp: clientData.cp,
		lastname: clientData.lastname,
		nombre: clientData.nombre,
		phone: clientData.phone,
		email: clientData.email,
		color: 	randomHex.generate()
	};
	db_general.addGenericDoc('cliente', NewClient, (error, result) => {
		if (error) callback(error, result);
		else callback(null, {insertedId: result});
	});
};
/**
 * Get all clients from firestore collection cliente
 * @param callback
 */
clienteModel.getAllCliente = (callback) => {
	db_general.getCollection('cliente', (error, result) => {
		if (error) callback(error, result);
		else callback(null, result);
	});
};

clienteModel.getClienteById = (cliente, callback) => {
	db_general.getGenericDoc('cliente', cliente, (error, result) => {
		if (error) callback(error, result);
		else callback(null, result);
	});
};

clienteModel.getShortClienteById = (cliente, callback) => {
	db_general.getGenericDoc('cliente', cliente, (error, result) => {
		if (error) callback(error, result);
		else {
			callback(null, {
				name: result.nombre,
				lastname: result.lastname,
				phone: result.phone
			});
		}
	});
};

clienteModel.updateCliente = (clienteData, callback) => {
	const updateClientData = {
		address: clienteData.address,
		cp: clienteData.cp,
		lastname: clienteData.lastname,
		nombre: clienteData.nombre,
		phone: clienteData.phone,
		email: clientData.email
	};
	db_general.genericUpdate('cliente', clienteData.document, updateClientData, (error, result) => {
		if (error) callback(error, result);
		else callback(null, result);
	});
};

module.exports = clienteModel;
