'use strict';

const config = require("../config");
const bucket = config.getBucketConection();

const filetype = require("../utils/filtetype");

const pushMessaging = require('../utils/PushNotifications/PushUtils');
const pushEXPO = require('../utils/PushNotifications/EXPOpush');
const pushFCM = require('../utils/PushNotifications/FCMpush');

const fs = require('fs');
const weekIdentifier = require('week-identifier');

const db_general = require('../orm/general_model');
const db_servicio = require('../orm/servicio');

const stats = require('./stats');



const serviceModel = {};

//--------------------------------------------------------------------------//

/**
 * Get all services from firestore collection service
 * @param callback
 */
serviceModel.getAllService = (callback) => {
	db_servicio.getServicesWithNames((error, result) => {
		if (error) callback(error, result);
		else callback(null, result);
	});
};

/**
 * Get service by ID
 * @param servicio
 * @param callback
 */
serviceModel.getServiceById = (servicio, callback) => {
	db_general.getGenericDoc('servicio', servicio, (error, result) => {
		if (error) callback(error, result);
		else callback(null, result);
	});
};
/**
 *	Retorna totes les alertes de un operari especififcat per le parametre uid
 * @param uid - USER IDENTIFIER
 * @param callback
 */
serviceModel.getAlerts = (uid, callback) => {
	if (uid !== undefined) {
		db_servicio.getStatusServices('noaccept', uid, (error, result) => {
			if (error) callback(error, result);
			else callback(null, result);
		});
	}
	else callback(500, "Error getting alerts");
};
/**
 * retorna tots els serveis oberts de un operari especififcat per le parametre uid
 * @param uid - USER IDENTIFIER
 * @param callback
 */
serviceModel.getServiceOpen = (uid, callback) => {
	if (uid !== undefined) {
		db_servicio.getStatusServices('open', uid, (error, result) => {
			if (error) callback(error, result);
			else callback(null, result);
		});
	}
	else callback(500, "Error getting open services");
};

/**
 *
 * @param uid
 * @param limitData
 * @param callback
 */
serviceModel.getserviceClose = (uid, limitData, callback) => {
	var allPeriods = {};
	db_servicio.getFacturationSnapshot(uid, limitData.max, (error, snapshot) => {
		if (error) callback(error, snapshot);
		else {
			var docs = snapshot._docs();
			var servicesRefs = [];
			const db = config.getDBConection();
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
				db_servicio.fillPeriodsWithServicesData(servicesRefs, allPeriods, (error, allPeriodsWithServices) =>{
					if (error) callback(error, allPeriodsWithServices);
					else callback(null, allPeriodsWithServices);
				});
			} else callback(null, allPeriods);
		}
	});
};

//--------------------------------------------------------------------------//

/**
 * Add a service to firestore
 * @param serviceData
 * @param callback
 */
serviceModel.addService = (serviceData, callback) => {
	const NewService = {
		address: serviceData.address,
		coordX: serviceData.coordX,
		coordY: serviceData.coordY,
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
	};
	db_general.addGenericDoc('servicio', NewService, (error, result) => {
		if (error) callback(error, result);
		else {
			const serviceID = result;
			serviceModel.sendPushToOperario(serviceData.operario, serviceID, "Nuevo servicio disponible", "new service" );
			callback(null, {service: serviceID});
		}
	});
};

//--------------------------------------------------------------------------//

/**
 *
 * @param reasignData
 * @param callback
 */
serviceModel.reasignService = function(reasignData, callback) {
	db_general.getGenericDoc('servicio', reasignData.service, (error, service) => {
		if (error) callback(error, service);
		else {
			const data = service;
			if (data.operario === reasignData.newOperario) callback(500, "Este operario ya tiene asignado este servicio");
			else if (data.status === 'close')  callback(500, "Este servicio ya está cerrado");
			else {
				const old_operari = data.operario;
				db_general.genericUpdate('servicio', reasignData.service, {operario: reasignData.newOperario}, (error, result) => {
					if (error) callback(error, result);
					else {
						if (old_operari !== "nulloperari") {
							serviceModel.sendPushToOperario(old_operari, reasignData.service, "Servicio retirado por admin", "service denied");
						}
						serviceModel.sendPushToOperario(reasignData.newOperario, reasignData.service, "Nuevo servicio disponible", "new service");
						callback(null, "service reasinged ok");
					}
				});
			}
		}
	});
};

/**
 * Accept del servei per l'operari -> Si tot OK, es fa update del valor status del serviceData.service document i es seteja a "obert"
 * @param serviceData - SERVICE DOCUMENT - USER IDENTIFIER
 * @param callback
 */
serviceModel.serviceAccept = (serviceData, callback) => {
	db_general.getGenericDoc('servicio', serviceData.service, (error, service) => {
		if (error) callback(error, service);
		else {
			const data = service;
			if (data.operario !== serviceData.uid) callback(500, "No tienes permisos sobre este documento");
			else if (data.status !== 'noaccept') callback(500, "El estado del servicio no permite que este pueda ser aceptado");
			else {
				const now = Date.now();
				db_general.genericUpdate('servicio', serviceData.service, {status: 'open', start_date: now}, (error, result) => {
					if (error) callback(error, result);
					else {
						stats.addServicioStat({event: 'accept', date: now, operario: data.operario});
						serviceModel.sendPushToAdmin(serviceData.service, serviceData.uid, "Servicio aceptado");
						callback(null, "accepted ok");
					}
				});
			}
		}
	});
};

/**
 * Operari denega el servei, es borra el seu id de l'asdignacio del servei, i el servei passa a noaccept
 * @param serviceData
 * @param callback
 */
serviceModel.serviceDeny = (serviceData, callback) => {
	db_general.getGenericDoc('servicio', serviceData.service, (error, service) => {
		if (error) callback(error, service);
		else {
			const data = service;
			if (data.operario !== serviceData.uid) callback(500, "No tienes permisos sobre este documento");
			else {
				const updateData = {status: 'noaccept', operario: 'nulloperario'};
				db_general.genericUpdate('servicio', serviceData.service, updateData, (error, result) => {
					if (error) callback(error, result);
					else {
						serviceModel.sendPushToAdmin(serviceData.service, serviceData.uid, "Servicio denegado");
						callback(null, "accepted ok");
					}
				});
			}
		}
	});
};

/**
 * Operari acaba el servei -> seteja el servei com a acabat
 * @param serviceData
 * @param callback
 */
serviceModel.serviceEnd = (serviceData, callback) => {
	db_general.getGenericDoc('servicio', serviceData.service, (error, service) => {
		if (error) callback(error, service);
		else {
			const data = service;
			if (data.operario !== serviceData.uid) callback(500, "No permissions on this document");
			else if (data.status === 'close') callback(500, "Service already closed");
			else if (data.status === 'noaccept') callback(500, "Service is not accepted yet");
			else {
				stats.addServicioStat({event: 'end', date: data.start_date, operario: data.operario});
				const actWeek = weekIdentifier(new Date());
				const updateData = {status: 'close', period: actWeek, nota: serviceData.nota};
				db_general.genericUpdate('servicio', serviceData.service, updateData, (error, result) => {
					if (error) callback(error, result);
					else {
						db_servicio.getFacturationWeekRef(serviceData.uid, actWeek, (error, fact) => {
							if (error) callback(error, fact);
							else {
								var updatedata;
								var serviceList = [];
								var promise;
								if (!fact.exists) {
									promise = new Promise((resolve, reject) => {
										serviceList[0] = serviceData.service;
										updatedata = {pagado: false, services: serviceList, order: actWeek};
										db_general.genericSetByReference(fact, updatedata, (error, result) => {
											if (error) reject(result);
											else resolve(result);
										});
									});
								} else { //fact doc exists
									promise = new Promise((resolve, reject) => {
										const datafact = fact.data();
										if (datafact.pagado === true) return callback(500, "Not possible to add service cause period is already paid");
										else {
											serviceList = datafact.services;
											serviceList.push(serviceData.service);
											updatedata = {services: serviceList};
											db_general.genericUpdateByReference(fact, updateData, (error, result) => {
												if (error) reject(result);
												else resolve(result);
											});
										}
									});
								}
								promise.then( () => {
									serviceModel.sendPushToAdmin(serviceData.service, serviceData.uid, "Servicio finalizado");
									stats.addFacturaStat({total: data.total_price, material: data.costs_price, date: data.start_date, operario: data.operario});
									callback(null, {
										cliente: data.cliente,
										operario: data.operario,
										total_price: data.total_price,
										costs_price: data.costs_price
									});
								}).catch( err => {
									callback(err.code, err);
								});
							}
						});
					}
				});
			}
		}
	});
};

/**
 * Seteja el pressupost d'un servei -> costos totals, i costos de materials (despeses operari)
 * @param serviceId - service IDentifier
 * @param budgetData  - total price +  costs price + operario uid
 * @param callback
 */
serviceModel.setBudget = (serviceId, budgetData, callback) => {
	db_general.getGenericDoc('servicio', serviceId, (error, doc) => {
		if (error) callback(error, doc);
		else {
			if (doc.operario !== budgetData.uid) callback(500, "No permissions on this document");
			else {
				const updateData = {
					total_price: budgetData.total_price,
					costs_price: budgetData.costs_price,
					isBudget: false
				};
				db_general.genericUpdateByReference(doc, updateData, (error, result) => {
					if (error) callback(error, result);
					else {
						serviceModel.sendPushToAdmin(serviceId, budgetData.uid, "Presupuesto actualizado");
						callback(null, result);
					}
				});
			}
		}
	});
};


serviceModel.payPeriod = (periodData, callback) => {
	db_servicio.getFacturationWeekRef(periodData.operario, periodData.periode, (error, doc) => {
		if (error) callback(error, doc);
		else {
			if (!doc.exists) callback(500, "No se encuentra este documento");
			else {
				const data = doc.data();
				if (weekIdentifier(new Date()) === periodData.periode) callback(500, "Este periodo aún no está cerrado");
				else if (data.pagado === true) callback(500, "Este periodo ya ha sido pagado");
				else {
					db_general.genericUpdateByReference(doc, {pagado: true}, (error, result) => {
						if (error) callback(error, result);
						else {
							callback(null, result);
						}
					});
				}
			}
		}
	});
};

//--------------------------------------------------------------------------//

/**
 *
 * @param serviceID
 * @param operarioUID
 * @param type
 */
serviceModel.sendPushToAdmin = (serviceID, operarioUID, type) => {
	let promise1 = new Promise ( (resolve, reject) => {
		db_general.getGenericDoc('operario', operarioUID, (error, doc) => {
			if (error) reject(error);
			else {
				const ServicePayload = {
					data: {
						type: type,
						service: serviceID,
						operario: operarioUID,
						name: doc.data().nombre
					}
				};
				resolve({servicePayload: ServicePayload});
			}
		});
	});
	let promise2 = new Promise ( (resolve, reject) => {
		pushMessaging.adminChatToken((error, adminChatToken) => {
			if (error) reject(error);
			else resolve({chatToken: adminChatToken});
		});
	});
	const promises = [promise1, promise2];
	Promise.all(promises)
		.then(() => {
			//SEND PUSH MESSAGE VIA FCM -> to admin (adminChatToken , ServicePayload)
			pushFCM.sendPushNotificationFCM(promises[1].chatToken, promises[0].servicePayload);
		}).catch( (err) => {
			console.log("Error sending push to admin: "+err);
		});
};

/**
 * Send Ms
 * @param uid
 * @param serviceId
 * @param body
 * @param type
 */
serviceModel.sendPushToOperario = (uid, serviceId, body, type) => {
	pushMessaging.operarioChatToken(uid, (error, operarioToken) => {
		if (!error) {
			const pushMessage = {
				to: operarioToken,
				sound: 'default',
				body: body,
				data: {
					type: type,
					service: serviceId
				}
			};
			//SEND PUSH MESSAGE VIA EXPO -> to operario
			pushEXPO.sendPushNotificationExpo(pushMessage);
		}
	});
};
/**
 * Upload multiple images to GCS
 * @param files --> files to upload, which name is imagen0, imagen1 ... imagenN-1 if uploadNumber equals N
 * @param uploadData --> .service, .uid (operario uid), .uploadNumber
 * @param callback
 */
serviceModel.uploadToServiceGCS = (files, uploadData, callback) => {
	db_general.getGenericDoc('servicio', uploadData.service, (error, data) => {
		if (error) callback(error, data);
		else {
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
						db_general.genericUpdate('servicio', uploadData.service, {images: images}, (error, result) => {
							if (error) callback(error, result);
							else {
								callback(null, {numFailed: failed, failed_id: failed_id});
							}
						});
					});
			}
		}
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
				const mime = filetype.ext().getContentType(filetype.ext().getExt(path));
				const base64 = new Buffer.from(content, 'binary').toString('base64');
				callback(null, {mime: mime, base64: base64});
			}
		});
	}).catch((err) => {
		callback(500, err);
	});
};


module.exports = serviceModel;
