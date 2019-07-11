'use strict';

const db_tools = require("../utils/db");
const gcs_tools = require("../utils/gcs");
const pushMessaging = require('../utils/sendpush');

const fs = require('fs');
var weekIdentifier = require('week-identifier');

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
 * Get service by ID
 * @param service
 * @param callback
 */
serviceModel.getServiceById = (service, callback) => {
    const db = db_tools.getDBConection();
    db.collection('servicio').doc(service).get()
        .then(doc => {
           if (!doc.exists) callback(500, "No document found");
           else {
               callback(null, doc.data());
           }
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
		db.collection('servicio').where('status', '==', 'open')
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
serviceModel.getserviceClose = (uid, limitData, callback) => {
		const db = db_tools.getDBConection();
		var allPeriods = {};
		db.collection('operario').doc(uid).collection('facturacion').orderBy('order','desc').limit(Number(limitData.max)).get()
			.then(snapshot => {
				var docs = snapshot._docs();
				var servicesRefs = [];
				for (let i = Number(limitData.min); i < docs.length; ++i) {
					const data = docs[i].data();
					const services = data.services;
					for (let j = 0; j < services.length; ++j) {
						let ref = db.collection('servicio').doc(services[j]);
						servicesRefs.push(ref);
					}
					let period = {};
					period.id = data.order;
					period.services = [];
					period.pagado = data.pagado;
					allPeriods[period.id] = period;
				}
				if (servicesRefs.length > 0) {
					db.getAll.apply(db, servicesRefs)
						.then (docs => {
							for (let i = 0; i < docs.length; ++i) {
								let service = {};
								const data = docs[i].data();
								service = {id: docs[i].id, data: data};
								if (data.period !== undefined) {
									allPeriods[data.period].services.push(service);
								}
							}
							callback(null, allPeriods);
						}).catch (err => {
						callback(500, err);
					});
				} else callback(null, allPeriods);
			}).catch(err => {
			callback(500, err);
		});
};

/**
 * POST
 */
/**
 * Add a service to firestore
 * @param serviceData
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
		pushMessaging.operarioChatToken(serviceData.operario, (error, operario_token) => {
			if (error === null) {
				serviceModel.sendMsgToOperario(operario_token, result.id, "Nuevo servicio disponible", "new service" );
				callback(null, {service: result.id });
			} else callback(500, "error getting operario token");
		});
	}).catch(err => {
		callback(500, "error inserting: "+err);
	});
};

/**
 * UPDATES
 */

/**
 *
 * @param reasignData
 * @param callback
 */
serviceModel.reasignService = function(reasignData, callback) {
	const db = db_tools.getDBConection();
	db.collection('servicio').doc(reasignData.service).get()
		.then( doc => {
			if (!doc.exists) callback(500, "No document found");
			else {
				const data = doc.data();
				if (data.operario === reasignData.newOperario) callback(500, "Este opeario ya tiene asignado este servicio");
				else if (data.status === 'close')  callback(500, "Este servicio ya está cerrado");
				else {
                    const old_operari = data.operario;
					doc.ref.update({
						operario: reasignData.newOperario
					});
					if (old_operari !== "nulloperari") {
                        pushMessaging.operarioChatToken(reasignData.newOperario, (error, old_operario_token) => {
                            if (error === null) {
                                serviceModel.sendMsgToOperario(old_operario_token, reasignData.service, "Servicio retirado por admin", "service denied");
                            }
                        });
                    }
					pushMessaging.operarioChatToken(reasignData.newOperario, (error, operario_token) => {
						if (error === null) {
							serviceModel.sendMsgToOperario(operario_token, reasignData.service, "Nuevo servicio disponible", "new service");
							callback(null, "service reasinged ok");
						} else callback(500, "error getting operario token");
					});
				}
			}
		}).catch( err => {
			callback(500, "error getting service");
		});
};

/**
 * Accept del servei per l'operari -> Si tot OK, es fa update del valor status del serviceData.service document i es seteja a "obert"
 * @param serviceData - SERVICE DOCUMENT - USER IDENTIFIER
 * @param callback
 */
serviceModel.serviceAccept = (serviceData, callback) => {
	const db = db_tools.getDBConection();
	db.collection('servicio').doc(serviceData.service).get()
		.then(doc => {
			if (!doc.exists) callback(500, "No document found");
			else {
				const data = doc.data();
				if (data.operario !== serviceData.uid) callback(500, "No permissions on this document");
				else if (data.status !== 'noaccept') callback(500, "Serivce actual status doesn't allow acceptance");
				else {
					doc.ref.update({
						status: 'open'
					});
                    pushMessaging.adminChatToken( (error, admin_token) => {
                        if (error === null) {
                            serviceModel.sendPushToAdmin(serviceData.service, admin_token, serviceData.uid, "Servicio aceptado");
                            callback(null, "updated ok");
                        } else callback(500, "error getting admin push token" + error);
                    });
				}
			}
		}).catch(err => {
		callback(500, err);
	});
};

/**
 * Operari denega el servei, es borra el seu id de l'asdignacio del servei, i el servei passa a noaccept
 * @param serviceData
 * @param callback
 */
serviceModel.serviceDeny = (serviceData, callback) => {
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
					pushMessaging.adminChatToken( (error, admin_token) => {
						if (error === null) {
							serviceModel.sendPushToAdmin(serviceData.service, admin_token, serviceData.uid, "Servicio denegado");
							callback(null, "updated ok");
						} else callback(500, "error getting admin push token" + error);
					});
				}
			}
		}).catch(err => {
		callback(500, err);
	});
};

/**
 * Operari acaba el servei -> seteja el servei com a acabat
 * @param serviceData
 * @param callback
 */
serviceModel.serviceEnd = (serviceData, callback) => {
    const db = db_tools.getDBConection();
    db.collection('servicio').doc(serviceData.service).get()
        .then(doc => {
            if (!doc.exists) callback(500, "No document found");
            else {
                const data = doc.data();
				const actWeek = weekIdentifier(new Date());
                if (data.operario !== serviceData.uid) callback(500, "No permissions on this document");
                else if (data.status === 'close') callback(500, "Service already closed");
                else if (data.status === 'noaccept') callback(500, "Service is not accepted yet");
                else {
                    doc.ref.update({
                        status: 'close',
						period: actWeek,
                        nota: serviceData.nota
                    });
                    db.collection('operario').doc(serviceData.uid).collection('facturacion').doc(String(actWeek)).get()
                        .then( fact => {
                            var updatedata;
                            var serviceList = [];
                            if (!fact.exists) {
                                serviceList[0] = serviceData.service;
                                updatedata = {
                                    pagado: false,
                                    services: serviceList,
									order: actWeek
                                };
                                fact.ref.set(updatedata);
                            } else { //exists
                                const datafact = fact.data();
                                if (datafact.pagado === true) return callback(500, "Not possible to add service cause period is already paid");
                                else {
                                    serviceList = datafact.services;
                                    serviceList.push(serviceData.service);
                                    updatedata = {services: serviceList};
                                    fact.ref.update(updatedata);
                                }
                            }
                            pushMessaging.adminChatToken( (error, admin_token) => {
                                if (error === null) {
                                    serviceModel.sendPushToAdmin(serviceData.service, admin_token, serviceData.uid, "Servicio finalizado");
                                }
                                callback(null, {
                                    cliente: data.cliente,
                                    operario: data.operario,
                                    total_price: data.total_price,
                                    costs_price: data.costs_price
                                });
                            });

                        }).catch( err => {
                            callback(500, "error ocurred while inserting to facturacion" + err);
                        });
                }
            }
        }).catch(err => {
            callback(500, err);
        });
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
                    pushMessaging.adminChatToken( (error, admin_token) => {
                        if (error === null) {
                            serviceModel.sendPushToAdmin(serviceData.service, admin_token, serviceData.uid, "Presupuesto actualizado");
                        }
                        callback(null, "updated ok");
                    });
				}
			}
		}).catch(err => {
		callback(500, err);
	});
};


serviceModel.payPeriod = (periodData, callback) => {
	const db = db_tools.getDBConection();
	db.collection('operario').doc(periodData.operario).collection('facturacion').doc(periodData.periode).get()
		.then (doc => {
			if (!doc.exists) callback(500, "No document found");
			else {
				const data = doc.data();
				if (weekIdentifier(new Date()) === periodData.periode) callback(500, "Period not closed yet");
				else if (data.pagado === true) callback(500, "Period already paid");
				else {
					doc.ref.update({
						pagado: true
					});
					callback(null, "updated ok");
				}
			}
		}).catch( err => {
			callback(500, err);
		});
};

/**
 * GOOGLE CLOUD RELATED
 */

/**
 *
 * @param serviceID
 * @param adminToken
 * @param operarioUID
 */
serviceModel.sendPushToAdmin = (serviceID, adminToken, operarioUID, type) => {
	const db = db_tools.getDBConection();
	db.collection('operario').doc(operarioUID).get()
		.then (doc => {
			const payload = {
				data: {
					type: type,
					service: serviceID,
					operario: operarioUID,
					name: doc.data().nombre
				}
			};
			//SEND PUSH MESSAGE VIA FCM -> to admin
			pushMessaging.sendPushNotificationFCM(adminToken, payload);
		});
};

/**
 *
 * @param destToken
 * @param serviceId
 */
serviceModel.sendMsgToOperario = (destToken, serviceId, body, type) => {
	const pushMessage = {
		to: destToken,
		sound: 'default',
		body: body,
		data: {
			type: type,
			service: serviceId
		}
	};
	//SEND PUSH MESSAGE VIA EXPO -> to operario
	pushMessaging.sendPushNotificationExpo(pushMessage);
};
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
				bucket.file('/service/'+name).download(options)
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
