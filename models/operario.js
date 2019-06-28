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
                chatToken: '',
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

operarioModel.getOnlineOperaris = (callback) => {
    const db = db_tools.getDBConection();
    var allOnline = [];
    db.collection('operario').get()
        .then(snapshot => {
            const docs = snapshot._docs();
            let lastPosition;
            let limitime;
            for (let i = 0; i < docs.length; ++i) {
                lastPosition = docs[i].data().lastPositionData;
                if (lastPosition !== undefined) {
                    limitime = Number(lastPosition[2]) + Number(5*3600*1000);
                    if (limitime > Date.now()) { //aun no han pasado 5 horas des de la ultima conextion
                        allOnline.push(docs[i].id);
                    }
                }
            }
            callback(null, allOnline);
        }).catch( err => {
        callback(500, err);
    });
};
module.exports = operarioModel;