'use strict';

const randomString = require('random-string');
const db_tools = require("../utils/db");
const admin = require('firebase-admin');

const operarioModel = {};
/**
 * Add a operario to firestore
 * @param operarioData
 * @param callback
 */
operarioModel.addOperario = (operarioData, callback) => {
    const pass = randomString({
                                     length: 6,
                                     numeric: true,
                                     letters: true
                                    });
    admin.auth().createUser({
        email: operarioData.email,
        password: pass
    }).then(function(userRecord) {
//            console.log("Successfully created new user:", userRecord.uid);
            const db = db_tools.getDBConection();
        const randomHex = require('random-hex');
        db.collection('operario').doc(userRecord.uid).set({
                email: operarioData.email,
                lastname: operarioData.lastname,
                nombre: operarioData.name,
                phone: operarioData.phone,
                chatToken: 'null',
                color: 	randomHex.generate()
        }).then(  result => {
                callback(null, {
                                uid: userRecord.uid,
                                password: pass
                                });
            }).catch(err => {
                callback(500, "error inserting: "+err);
            });
        }).catch(function(error) {
            console.log("Error creating new user:", error);
            callback(500, "Error creating new user:"+error);
        });

};
/**
 * Get all operarios from firestore collection operario
 * @param callback
 */
operarioModel.getAllOperario = (callback) => {
    const db = db_tools.getDBConection();
    var allOperarios = [];
    db.collection('operario').get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                allOperarios.push({id: doc.id, data: doc.data()});
            });
            callback(null, allOperarios);
        }).catch(err => {
        callback(500, err);
    });
};
/**
 *
 * @param operario
 * @param callback
 */
operarioModel.getOperarioById = (operario, callback) => {
    const db = db_tools.getDBConection();
    db.collection('operario').doc(operario).get()
        .then( doc => {
            if (!doc.exists) callback(500, "No document found");
            else {
                callback(null, doc.data());
            }
        }).catch (err => {
            callback(500, "error getting operario"+err);
        });
};

/**
 *
 * @param operarioData
 * @param callback
 */
operarioModel.updateOperario = (operarioData, callback) => {
    const db = db_tools.getDBConection();
    db.collection('operario').doc(operarioData.uid).get()
        .then( doc => {
            doc.ref.update({
                email: operarioData.email,
                lastname: operarioData.lastname,
                name: operarioData.name,
                phone: operarioData.phone
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
/**
 *
 * @param callback
 */
operarioModel.getOnlineOperaris = (callback) => {
    const db = db_tools.getDBConection();
    var allOnline = [];
    db.collection('operario').get()
        .then(snapshot => {
            const docs = snapshot._docs();
            let lastPosition;
            let limitime;
            for (let i = 0; i < docs.length; ++i) {
                const data = docs[i].data();
                lastPosition = data.lastPositionData;
                if (lastPosition !== undefined && data.chatToken !== 'null') {
                    limitime = Number(lastPosition[2]) + Number(5*3600*1000);
                    if (limitime > Date.now()) { //aun no han pasado 5 horas des de la ultima conextion
                        allOnline.push({id: docs[i].id,
                                        data: docs[i].data()});
                    }
                }
            }
            callback(null, allOnline);
        }).catch( err => {
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
operarioModel.setLastPosition = (lastPositionData, callback) => {
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
 *
 * @param uid
 * @param callback
 */
operarioModel.getCurrentOperario = (uid, callback) => {
    const db = db_tools.getDBConection();
    db.collection('operario').doc(uid).get()
        .then (doc => {
            if (!doc.exists) callback(500, "No doc found");
            else {
                callback(null, doc.data());
            }
        }).catch (err => {
            callback(500, err);
        });
};
module.exports = operarioModel;