'use strict'

var authModel = {};


var admin = require('firebase-admin');
/**
 * Valida un token d'un operari
 * @param token
 * @param callback
 */
// authModel.validateToken = (token, callback) => {
// 	const idToken = token;
// 	admin.auth().verifyIdToken(idToken).then((decodedToken) => {
// 	    var uid = decodedToken.uid;
// 	    callback(null, uid);
//   }).catch(function(error) {
// 		callback(500, error.message);
//   });
// };
// /**
//  * Valida el token d'uin admin
//  * @param token
//  * @param callback
//  */
// authModel.validateAdminToken = (token, callback) => {
// 	const idToken = token;
// 	if (idToken !== undefined) {
// 		admin.auth().verifyIdToken(idToken).then((decodedToken) => {
// 			const uid = decodedToken.uid;
// 			if (decodedToken.adminUser ===  true) callback(null, uid);
// 			else  callback(400, "Not admin token");
// 		}).catch(function(error) {
// 			callback(500, error.message);
// 		});
// 	}	else callback(500, "No token");
// };

/**
 * Valida que l'admin sigui ell, i ho retonra
 * @param token
 * @param callback
 */
authModel.validateAdmin = (token, callback) => {
	const idToken = token;
	admin.auth().verifyIdToken(idToken).then((decodedToken) => {
		const admin_uid = "CVvefgI67mZVUAXmcoLNBZuWRwF3";
		const uid = decodedToken.uid;
		if (uid === admin_uid) {
			callback(null, uid);
		}
		else callback(500, "You are not granted as admin user");
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
			callback(500, err.message);
		});
	} else callback(500, "No token");
};
module.exports = authModel;