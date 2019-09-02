'use strict';

const config = require('../config');
const bucket = config.getBucketConection();

const db_general = require('../orm/general_model');
const db_chat = require("../orm/chat");

const filetype = require("../utils/filtetype");
const pushMessaging = require('../utils/PushNotifications/PushUtils');
const pushExpo = require('../utils/PushNotifications/EXPOpush');
const pushFCM = require('../utils/PushNotifications/FCMPush');
const fs = require('fs');


const chatModel = {};

//--------------------------------------------------------------------------//

/**
 *
 * @param chatData
 * @param callback
 */
chatModel.getChat = (chatData, callback) => {
    db_chat.getChatMessages(chatData.uid, Number(chatData.first), Number(chatData.last), (error, data) => {
        if (error) callback(error, data);
        else callback(null, data);
    });
};

/**
 * Get admin collection lastread field (timestamp)
 * @param uid
 * @param callback
 */
chatModel.getAdminLastRead = function (uid, callback) {
    db_chat.getLastRead(uid, (error, data) => {
        if (error) callback(error, data);
        else callback(null, data);
    });
};

//--------------------------------------------------------------------------//

/**
 * Fa update del usuari amb uid del token .chattoken
 * @param collection -> colleccion a la que se aplica (admin o operario)
 * @param chatData -> .uid && .chattoken
 * @param callback
 */
chatModel.updateToken = (collection, chatData, callback) => {
    db_chat.updateChatToken(collection, chatData.uid, chatData.chatToken, (error, data) => {
        if (error) callback(error, data);
        else callback(null, data);
    });
};

/**
 * Update Admin LastRead field
 * @param uid
 * @param callback
 */
chatModel.setAdminlastRead = function (uid, callback){
    db_chat.updateLastRead(uid, (error, data) => {
        if (error) callback(error, data);
        else callback(null, data);
    });
};

/**
 ***************************** GOOGLE CLOUD RELATED *****************************
 */

/**
 *
 * @param msg
 * @param image
 * @param operarioUID
 */
chatModel.sendChatMsgToAdmin = (msg, image, operarioUID, callback) => {
    const now = Date.now();
    let promise1 = new Promise ( (resolve, reject) => {
        db_general.getGenericDoc('operario', operarioUID, (error, doc) => {
            if (error) reject(error);
            else {
                const ChatPayload = {
                    data: {
                        type: "chat",
                        message: msg,
                        operario: operarioUID,
                        date: String(now),
                        image: image,
                        name: doc.nombre
                    }
                };
                resolve({ChatPayload: ChatPayload});
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
            const messageData = {
                admin: false,
                date: now,
                message: msg,
                image: image
            };
            db_chat.addChatEntry(operarioUID, messageData);
            //SEND PUSH MESSAGE VIA FCM -> to admin (adminChatToken , ChatPayload)
            pushFCM.sendPushNotificationFCM(promises[1].chatToken, promises[0].ChatPayload);
            callback(null, "all went ok");
        }).catch( (err) => {
            callback(500, "Error happened: "+err);
        });
};

/**
 *
 * @param msg
 * @param image
 * @param operarioUID
 */
chatModel.sendChatMsgToOperario = (msg, image, operarioUID, callback) => {
    const now = Date.now();
    pushMessaging.operarioChatToken(operarioUID, (error, operarioToken) => {
        if (error) callback(500, "error getting chatToken "+operarioToken);
        else {
            const chatMessage = {
                admin: true,
                date: now,
                message: msg,
                image: image
            };
            db_chat.addChatEntry(operarioUID, chatMessage);
            const pushMessage = {
                to: operarioToken,
                sound: 'default',
                body: "Nuevo mensaje de Bosco",
                data: { type: "chat",
                    message: msg,
                    date: String(now),
                    image: image
                }
            };
            //SEND PUSH MESSAGE VIA EXPO -> to operario
            pushExpo.sendPushNotificationExpo(pushMessage);
            callback(null, "all went ok");
        }
    });
};

/**
 *
 * @param image
 * @param operarioID
 * @param toAdmin
 * @param callback
 */
chatModel.uploadToChatGCS = (image, operarioID, toAdmin, callback) => {
    const path = image.path;
    var name = path.replace('uploads\\chat\\','');
    name = name.replace('uploads/chat/','');
    bucket.upload(path, {public: false, destination: "chat/"+name})
        .then(file => {
            if (toAdmin) {
                chatModel.sendChatMsgToAdmin((file[0].name).replace('chat/',''), "true", operarioID, (error, result) => {
                    if (error) callback(error, result);
                    else {
                        callback(null, {
                            status: result,
                            imageName: (file[0].name).replace('chat/','')
                        });
                    }
                });
            } else {
                chatModel.sendChatMsgToOperario((file[0].name).replace('chat/',''), "true", operarioID, (error, result) => {
                    if (error) callback(error, result);
                    else   {
                        callback(null, {
                            status: result,
                            imageName: (file[0].name).replace('chat/','')
                        });
                    }
                });
            }
        }).catch( err => {
            callback(500, err);
        });
};

/**
 *
 * @param name
 * @param callback
 * @returns {Promise<any | never>}
 */
chatModel.downlaodFromChatGCS = (name, callback) => {
    const path = './downloads/chat/'+name;
    return new Promise ((resolve, reject) => {
        fs.exists(path, function(exists) {
            if (exists) {  //file exists
                resolve();
            } else { //file not exists
                const options = {
                    destination: path
                };
                bucket.file('chat/'+name).download(options)
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


module.exports = chatModel;