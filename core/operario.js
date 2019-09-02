'use strict';

const randomString = require('random-string');
const config = require("../config");
const admin = require('firebase-admin');

const db_general = require('../orm/general_model');
const db_operario = require('../orm/operario');

const operarioModel = {};
/**
 * Add a operario to firestore
 * @param operarioData
 * @param callback
 */
operarioModel.addOperario = (operarioData, callback) => {
    const pass = randomString({length: 6, numeric: true, letters: true});
    admin.auth().createUser({
        email: operarioData.email,
        password: pass
    }).then(function(userRecord) {
        const randomHex = require('random-hex');
        const NewOperario = {
            email: operarioData.email,
            lastname: operarioData.lastname,
            nombre: operarioData.name,
            phone: operarioData.phone,
            chatToken: 'null',
            color: 	randomHex.generate()
        };
        db_operario.addOperario(NewOperario, userRecord.uid, (error, result) => {
            if (error) callback(error, result);
            else {
                callback(null, {
                    uid: userRecord.uid,
                    password: pass
                });
            }
        });
    }).catch(function(error) {
        callback(error.code, "Error creating new user:"+error);
    });

};
/**
 * Get all operarios from firestore collection operario
 * @param callback
 */
operarioModel.getAllOperario = (callback) => {
    db_general.getCollection('operario', (error, result) => {
        if (error) callback(error, result);
        else callback(null, result);
    });
};
/**
 *
 * @param operario
 * @param callback
 */
operarioModel.getOperarioById = (operario, callback) => {
    db_general.getGenericDoc('operario', operario, (error, result) => {
        if (error) callback(error, result);
        else callback(null, result);
    });
};

/**
 *
 * @param operarioData
 * @param callback
 */
operarioModel.updateOperario = (operarioData, callback) => {
    const updateOperarioData = {
        email: operarioData.email,
        lastname: operarioData.lastname,
        name: operarioData.name,
        phone: operarioData.phone
    };
    db_general.genericUpdate('operario', operarioData.uid, updateOperarioData, (error, result) => {
        if (error) callback(error, result);
        else callback(null, result);
    });
};
/**
 *
 * @param callback
 */
operarioModel.getOnlineOperaris = (callback) => {
    var allOnline = [];
    db_general.getCollectionSnapshot('operario', (error, snapshot) => {
       if (error) callback(error, snapshot);
       else {
           const docs = snapshot._docs();
           let lastPosition;
           let limitime;
           for (let i = 0; i < docs.length; ++i) {
               const data = docs[i].data();
               lastPosition = data.lastPositionData;
               if (lastPosition !== undefined && data.chatToken !== 'null') {
                   limitime = Number(lastPosition[2]) + Number(5*3600*1000);
                   if (limitime > Date.now()) { //aun no han pasado 5 horas des de la ultima conextion
                       allOnline.push({id: docs[i].id, data: docs[i].data()});
                   }
               }
           }
           callback(null, allOnline);
       }
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
    let positionUpdate = [];
    positionUpdate[0] = lastPositionData.lat;
    positionUpdate[1] = lastPositionData.lon;
    positionUpdate[2] = lastPositionData.time;
    db_operario.updatePosition(positionUpdate, lastPositionData.operario, (error, result) => {
        if (error) callback(error, result);
        else callback(null, result);
    });
};

module.exports = operarioModel;