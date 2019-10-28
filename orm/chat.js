'use strict';

const config = require('../config');
const db = config.getDBConection();
const constant = require("../utils/define");

var ORMchatModel = {};
/**
 *
 * @param operarioUID
 * @param first
 * @param last
 * @param callback
 */
ORMchatModel.getChatMessages = function (operarioUID, first, last, callback) {
    var messages = [];
    if (db) {
        db.collection(constant.OperarioCollection).doc(operarioUID).collection(constant.ChatCollection).orderBy('date','desc').limit(last).get()
            .then( snapshot => {
                var docs = snapshot._docs();
                let doc;
                for (var i = first; last !== first; ++i) {
                    doc = docs[i];
                    if (doc) {
                        messages.push(doc.data());
                    }
                    last--;
                }
                callback(null, messages);
            }).catch (err => {
            callback(500, "error getting messages" + err);
        });
    } else callback(500, "No database");
};
/**
 *
 * @param adminUID
 * @param callback
 */
ORMchatModel.getLastRead = function(adminUID, callback) {
    db.collection(constant.AdminCollection).doc(adminUID).get()
        .then(doc => {
            callback(null, doc.data().lastRead);
        }).catch(err => {
            callback(500, err);
        });
};
/**
 *
 * @param collection
 * @param uid
 * @param chatToken
 * @param callback
 */
ORMchatModel.updateChatToken = function(collection, uid, chatToken, callback) {
    db.collection(collection).doc(uid).update({
        chatToken: chatToken
    }).then( () => {
        callback(null, "chat token updated ok");
    }).catch( err => {
        callback(err.code, err.message);
    });
};

ORMchatModel.updateLastRead = function(uid, callback) {
    db.collection(constant.AdminCollection).doc(uid).update({
        lastRead: Date.now()
    }).then( () => {
        callback(null, "updated ok");
    }).catch( (err) => {
        callback(err.code, err);
    });
};

ORMchatModel.addChatEntry = function(operarioUID, chatMessage) {
  db.collection(constant.OperarioCollection).doc(operarioUID).collection(constant.ChatCollection).add(chatMessage);
};

module.exports = ORMchatModel;
