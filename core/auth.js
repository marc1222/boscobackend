'use strict';

var authModel = {};
var admin = require('firebase-admin');
const constant = require("../utils/define");

const db_general = require('../orm/general_model');
/**
 * Valida que l'admin sigui ell, i ho retonra
 * @param token
 * @param callback
 */
authModel.validateAdmin = (token, callback) => {
	const idToken = token;
	admin.auth().verifyIdToken(idToken).then((decodedToken) => {
		db_general.getCollectionSnapshot(constant.AdminCollection, (error, adminSnapshot) => {
			if (error) callback(error, adminSnapshot);
			else {
				const admins = adminSnapshot._docs();
				for (let admin of admins) {
					if (admin.id === decodedToken.uid) {
						return callback(null, decodedToken.uid);
					}
				}
				callback(500, "You are not granted as admin user");
			}
		});
	}).catch(function(error) {
		callback(500, error.message);
	});
};

/**
 * Crea un token d'admin i el retorna en el callback
 * @param uid
 * @param callback
 */
authModel.createAdminCustomToken = (uid, callback) => {
	if (uid !== undefined) {
		const additionalClaims = {
			adminUser: true
		};
		admin.auth().createCustomToken(uid, additionalClaims)
			.then( customToken => {
				callback(null, customToken);
			}).catch(err => {
				callback(400, err.message);
			});
	} else callback(500, "No token");
};

module.exports = authModel;
