'use strict';

const db_tools = require("../utils/db");
const gcs_tools = require("../utils/gcs");
const fs = require('fs');

const serviceModel = {};

/**
 * GETTERS
 */

/**
 * Get all services from firestore collection service
 * @param callback
 */
serviceModel.getAllService = (callback) => {
	const db = db_tools.getDBConection();
	var allServices = [];
	db.collection('servicio').get()
		.then(snapshot => {
			snapshot.forEach(doc => {
				allServices.push({id: doc.id, data: doc.data()});
			});
			callback(null, allServices);
		}).catch(err => {
		callback(500, err);
	});
};
/**
 *	Retorna totes les alertes de un operari especififcat per le parametre uid
 * @param uid - USER IDENTIFIER
 * @param callback
 */
serviceModel.getAlerts = (uid, callback) => {
	if (uid !== undefined) {
		const db = db_tools.getDBConection();
		var allAlerts = [];
		db.collection('servicio').where('status', '==', 'noaccept')
			.where('operario', '==', uid).get()
			.then(snapshot => {
				let i = 0;
				snapshot.forEach(doc => {
					allAlerts.push({id: doc.id, data: doc.data()});
					++i;
				});
				callback(null, allAlerts);
			}).catch(err => {
			callback(500, err);
		});
	}
	else callback(500, "Error getting alerts");
};
/**
 * retorna tots els serveis oberts de un operari especififcat per le parametre uid
 * @param uid - USER IDENTIFIER
 * @param callback
 */
serviceModel.getserviceOpen = (uid, callback) => {
	if (uid !== undefined) {
		const db = db_tools.getDBConection();
		var allAlerts = [];
		db.collection('servicio').where('status', '==', 'obert')
			.where('operario', '==', uid).get()
			.then(snapshot => {
				let i = 0;
				snapshot.forEach(doc => {
					allAlerts.push({id: doc.id, data: doc.data()});
					++i;
				});
				callback(null, allAlerts);
			}).catch(err => {
			callback(500, err);
		});
	}
	else callback(200, "Error getting alerts");
};
/**
 *
 * @param uid - USER IDENTIFIER
 * @param callback
 */
serviceModel.getserviceClose = (uid, callback) => {
	if (uid !== undefined) {
		const db = db_tools.getDBConection();
		var allAlerts = [];
		db.collection('servicio').where('status', '==', 'tancat').get()
			.then(snapshot => {
				let i = 0;
				snapshot.forEach(doc => {
					allAlerts.push({id: doc.id, data: doc.data()});
					i++;
				});
				callback(null, allAlerts);
			}).catch(err => {
			callback(500, err);
		});
	}
	else callback(500, "Error getting alerts");
};

/**
 * POST
 */
/**
 * Add a service to firestore
 * @param clientData
 * @param callback
 */
serviceModel.addService = (serviceData, callback) => {
	const db = db_tools.getDBConection();
	db.collection('servicio').add({
		address: serviceData.address,
		budget: serviceData.budget,
		cliente: serviceData.cliente,
		note: serviceData.note,
		priority: serviceData.priority,
		title: serviceData.title,
		type: serviceData.type,
		operario: serviceData.operario,
		status: 'noaccept',
		created_at: Date.now(),
		scheduled_date: serviceData.scheduled_date,
		start_date: '',
		total_price: -1,
		costs_price: -1,
		isBudget: serviceData.isBudget
	}).then(  result => {
		callback(null, "ok");
	}).catch(err => {
		callback(500, "error inserting: "+err);
	});
};

/**
 * UPDATES
 */
/**
 * Accept del servei per l'operari -> Si tot OK, es fa update del valor status del serviceData.service document i es seteja a "obert"
 * @param serviceData - SERVICE DOCUMENT - USER IDENTIFIER
 * @param callback
 */
serviceModel.serviceAccept = (serviceData, callback) => {
	if (serviceData.uid !== undefined && serviceData.service !== undefined) {
		const db = db_tools.getDBConection();
		db.collection('servicio').doc(serviceData.service).get()
			.then(doc => {
				if (!doc.exists) callback(500, "No document found");
				else {
					const data = doc.data();
					if (data.operario !== serviceData.uid) callback(500, "No permissions on this document");
					else {
						doc.ref.update({
							status: 'obert'
						});
						callback(null, "updated ok");
					}
				}
			}).catch(err => {
			callback(500, err);
		});
	} else callback(500, "Error accepting service");
};

/**
 * Operari denega el servei, es borra el seu id de l'asdignacio del servei, i el servei passa a noaccept
 * @param serviceData
 * @param callback
 */
serviceModel.serviceDeny = (serviceData, callback) => {
	if (serviceData.uid !== undefined && serviceData.service !== undefined) {
		const db = db_tools.getDBConection();
		db.collection('servicio').doc(serviceData.service).get()
			.then(doc => {
				if (!doc.exists) callback(500, "No document found");
				else {
					const data = doc.data();
					if (data.operario !== serviceData.uid) callback(500, "No permissions on this document");
					else {
						doc.ref.update({
							status: 'noaccept',
							operario: 'nuloperario'
						});
						callback(null, "updated ok");
					}
				}
			}).catch(err => {
			callback(500, err);
		});
	} else callback(500, "Error denying service");
};

/**
 * Operari acaba el servei -> seteja el servei com a acabat
 * @param serviceData
 * @param callback
 */
serviceModel.serviceEnd = (serviceData, callback) => {
	if (serviceData.uid !== undefined && serviceData.service !== undefined) {
		const db = db_tools.getDBConection();
		db.collection('servicio').doc(serviceData.service).get()
			.then(doc => {
				if (!doc.exists) callback(500, "No document found");
				else {
					const data = doc.data();
					if (data.operario !== serviceData.uid) callback(500, "No permissions on this document");
					else if (data.status === 'close') callback(500, "Service already closed");
					else {
						doc.ref.update({
							status: 'close'
						});
						callback(null, {
							cliente: data.cliente,
							operario: data.operario,
							total_price: data.total_price,
							costs_price: data.costs_price
						});
					}
				}
			}).catch(err => {
			callback(500, err);
		});
	} else callback(500, "Error ending service");
};

/**
 * Seteja el pressupost d'un servei -> costos totals, i costos de materials (despeses operari)
 * @param serviceId - service IDentifier
 * @param budgetData  - total price +  costs price + operario uid
 * @param callback
 */
serviceModel.setBudget = (serviceId, budgetData, callback) => {
	const db = db_tools.getDBConection();
	db.collection('servicio').doc(serviceId).get()
		.then(doc => {
			if (!doc.exists) callback(500, "No document found");
			else {
				const data = doc.data();
				if (data.operario !== budgetData.uid) callback(500, "No permissions on this document");
				else {
					doc.ref.update({
						total_price: budgetData.total_price,
						costs_price: budgetData.costs_price,
						isBudget: false
					});
					callback(null, "updated ok");
				}
			}
		}).catch(err => {
		callback(500, err);
	});
};
/**
 * Update operario last Position vector
 * @param lastPositionData = {
				lat: req.body.lat,
				lon: req.body.lon,
				time: Date.now(),
				operario: req.uid
			};
 * @param callback
 */
serviceModel.setLastPosition = (lastPositionData, callback) => {
	const db = db_tools.getDBConection();
	db.collection('operario').doc(lastPositionData.operario).get()
		.then( (doc)=> {
			if (!doc.exists) callback(500, "No document found");
			else {
				let positionUpdate = [];
				positionUpdate[0] = lastPositionData.lat;
				positionUpdate[1] = lastPositionData.lon;
				positionUpdate[2] = lastPositionData.time;
				doc.ref.update({
					lastPositionData: positionUpdate
				});
				callback(null, "updated ok");
			}
		}).catch((err)=> {
			callback(500, err);
		});
};

/**
 * GOOGLE CLOUD RELATED
 */

/**
 * Upload multiple images to GCS
 * @param files --> files to upload, which name is imagen0, imagen1 ... imagenN-1 if uploadNumber equals N
 * @param uploadData --> .service, .uid (operario uid), .uploadNumber
 * @param callback
 */
serviceModel.uploadToServiceGCS = (files, uploadData, callback) => {
    const db = db_tools.getDBConection();
    db.collection('servicio').doc(uploadData.service).get()
        .then(doc => {
            if (!doc.exists) callback(500, "No service found");
            else {
                const data = doc.data();
                if (data.operario !== uploadData.uid) callback(500, "No permissions on this service");
                else {
                    var images = [];
                    if (data.images !== undefined) images = data.images;
                    var uploads = uploadData.uploadNumber;
                    var i = 0;
                    var promises = [];
                    while (uploads > 0) {
                        const promise = new Promise((resolve, reject) => {
                            let aux = "imagen"+i;
                            let image = files[aux];
                            if (image !== undefined) {
                                let path = image.path;
                                let name = path.replace('uploads\\service\\','');
                                name = name.replace('uploads/service/','');
                                const bucket = gcs_tools.getBucketConection();
                                bucket.upload(path, {public: false, destination: "service/"+name})
                                    .then(file => {
                                        resolve(name);
                                    }).catch( err => {
                                        reject(err);
                                    });
                            } else reject("no imagen"+i);
                        });
                        promises.push(promise);
                        i++;
                        uploads--;
                    }
                    var failed = 0;
                    var failed_id = [];
                    Promise.all(promises.map(p => p.catch(() => undefined)))
                        .then((promises) => {
                            for (var i = 0; i < promises.length; ++i) {
                                var promise = promises[i];
                                if (promise !== undefined) { //if enters if, means promise worked and image uploaded correctly
                                    images.push(promise);
                                }
                                else { //error uploading
                                    failed_id.push("imagen"+i);
                                    failed++;
                                }
                            }
                            //proceed insert db image names that uploaded correctly
                            db.collection('servicio').doc(uploadData.service).get()
                                .then(doc => {
                                    doc.ref.update({
                                        images: images
                                    }).then ( () => {
                                        callback(null, {numFailed: failed, failed_id: failed_id});
                                    }).catch(err  => {
                                        callback(500, "error updating"+err);
                                    });
                                });
                        });
                }
            }
        }).catch(err => {
            callback(500, err);
        });
};
/**
 * Downloads an image from GCS and
 * @param name - service name image
 * @param callback
 * @returns {Promise<any | never>}
 */
serviceModel.downlaodFromServiceGCS = (name, callback) => {
	const path = './downloads/service/'+name;
	return new Promise ((resolve, reject) => {
		fs.exists(path, function(exists) {
			if (exists) {  //file exists
				resolve();
			} else { //file not exists
				const bucket = gcs_tools.getBucketConection();
				const options = {
					destination: path
				};
				bucket.file('service/'+name).download(options)
					.then(file =>  {
						resolve();
					}).catch(err => {
					fs.unlink(path, (error) => {
						reject(err);
					});
				});
			}
		});
	}).then (() => {
		fs.readFile(path, function (err, content) {
			if (err) {
				callback(400, "no such image");
			} else {
				//specify the content type in the response will be an image
				const mime = gcs_tools.ext().getContentType(gcs_tools.ext().getExt(path));
				const base64 = new Buffer.from(content, 'binary').toString('base64');
				callback(null, {mime: mime, base64: base64});
			}
		});
	}).catch((err) => {
		callback(500, err);
	});
};


module.exports = serviceModel;
