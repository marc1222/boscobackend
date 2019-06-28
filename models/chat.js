'use strict';

const db_tools = require("../utils/db");
const gcs_tools = require("../utils/gcs");
const pushMessaging = require('../utils/sendpush');
const fs = require('fs');


const chatModel = {};
/**
 * Fa update del usuari amb uid del token .chattoken
 * @param chatData -> .uid && .chattoken
 * @param callback
 */
chatModel.updateToken = (chatData, callback) => {
    if (chatData.uid !== null && chatData.chatToken !== null) {
        const db = db_tools.getDBConection();
        db.collection('operario').doc(chatData.uid).get()
            .then(user => {
                user.ref.update({
                   chatToken: chatData.chatToken
                });
                callback(null, "chat token updated ok");
            }).catch( err => {
                callback(err.code, err.message);
            });
    } else callback(500, "Error updating chat token");
};
/**
 * Fa update del usuari amb uid del token .chattoken
 * @param chatData ->  .chattoken
 * @param callback
 */

chatModel.updateAdminToken = (chatData, callback) => {
    if (chatData.chatToken !== null && chatData.uid !== null) {
        const db = db_tools.getDBConection();
        db.collection('admin').doc(chatData.uid).get()
            .then(admin => {
                admin.ref.update({
                    chatToken: chatData.chatToken
                });
                callback(null, "chat token updated ok");
            }).catch( err => {
            callback(500, err.message);
        });
    } else callback(500, "Error updating chat token");
};
/**
 * Get admin chat token to send token to them
 * @param callback - return array where a pos is like: [i] -> {chatToken: xxx_chatTokenValue_xxx}
 */
chatModel.adminChatToken = (callback) => {
    const db = db_tools.getDBConection();
    var adminChatToken;
    db.collection('admin').get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                adminChatToken = doc.data().chatToken;
            });
            callback(null, adminChatToken);
        }).catch(err => {
            callback(500, err.message);
        });
};
/**
 *
 * @param uid - uid of user to get chatToken
 * @param callback - return chatToken, or error
 */
chatModel.operarioChatToken = (uid, callback) => {
    if (uid !== null) {
        const db = db_tools.getDBConection();
        db.collection('operario').doc(uid).get()
            .then(user => {
                callback(null, user.data().chatToken);
            }).catch(err => {
                callback(500, err.message);
            });
    } else callback(500, "No uid defined when getting operario chat token");
};

chatModel.sendPushToAdmin = (msg, image, adminToken, operarioUID) => {
    //SAVE MESSAGE TO DB
    const db = db_tools.getDBConection();
    const now = Date.now();
    db.collection('operario').doc(operarioUID).collection('chat')
        .add({
            admin: false,
            date: now,
            message: msg,
            image: image
        });
    const payload = {
        data: {
            type: "chat",
            message: msg,
            operario: operarioUID,
            date: String(now),
            image: image
        }
    };
    //SEND PUSH MESSAGE VIA FCM -> to admin
    pushMessaging.sendPushNotificationFCM(adminToken, payload);
};

chatModel.sendMsgToOperario = (msg, destToken, operarioUID) => {
    //SAVE MESSAGE TO DB
    const db = db_tools.getDBConection();
    const now = Date.now();
    db.collection('operario').doc(operarioUID).collection('chat')
        .add({
            admin: true,
            date: now,
            message: msg
        });

    const pushMessage = {
        to: destToken,
        sound: 'default',
        body: "Nuevo mensaje de Bosco",
        data: { type: "chat",
                message: msg,
                date: String(now)
              }
    };
    //SEND PUSH MESSAGE VIA EXPO -> to operario
     pushMessaging.sendPushNotificationExpo(pushMessage);
};

chatModel.getChat = (chatData, callback) => {
    const first = Number(chatData.first);
    var last = Number(chatData.last);
    const operarioUID = chatData.uid;
    var messages = [];
    const db = db_tools.getDBConection();
    db.collection('operario').doc(operarioUID).collection('chat').orderBy('date','desc').limit(last).get()
        .then( snapshot => {
            var docs = snapshot._docs();
            let doc;
            for (var i = first; last !== first; ++i) {
               doc = docs[i];
               if (doc) {
                   messages.push(doc.data());
               }
               //console.log(doc.data().date);
               last--;
            }
            callback(null, messages);
        }).catch (err => {
            callback(500, "error getting messages" + err);
        });

};

chatModel.uploadToChatGCS = (image, operarioID, admin, callback) => {
    const path = image.path;
    var name = path.replace('uploads\\chat\\','');
    name = name.replace('uploads/chat/','');
    const bucket = gcs_tools.getBucketConection();
    bucket.upload(path, {public: false, destination: "chat/"+name})
        .then(file => {
            if (admin) {
                chatModel.adminChatToken( (error, adminChatToken) => {
                    if (error === null) {
                        chatModel.sendPushToAdmin((file[0].name).replace('chat/',''), "true", adminChatToken, operarioID);
                        callback(null, {
                            status: "uploaded ok and sent push to admin",
                            imageName: (file[0].name).replace('chat/','')
                        });
                    } else {
                        callback(500, error + adminChatToken);
                    }
                });
            } else {
                chatModel.operarioChatToken(operarioID, (error, oprarioChatToken) => {
                   if (error === null) {
                       chatModel.sendMsgToOperario((file[0].name).replace('chat/',''), "true", oprarioChatToken, operarioID);
                       callback(null, {
                           status: "uploaded ok and sent push to operario",
                           imageName: (file[0].name).replace('chat/','')
                       });
                   } else {
                       callback(500, error + oprarioChatToken);
                   }
                });
            }
        }).catch( err => {
           callback(500, err);
        });
};

chatModel.downlaodFromChatGCS = (name, callback) => {
    const path = './downloads/chat/'+name;
    return new Promise ((resolve, reject) => {
        fs.exists(path, function(exists) {
            if (exists) {  //file exists
                resolve();
            } else { //file not exists
                const bucket = gcs_tools.getBucketConection();
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
                const mime = gcs_tools.ext().getContentType(gcs_tools.ext().getExt(path));
                const base64 = new Buffer.from(content, 'binary').toString('base64');
                callback(null, {mime: mime, base64: base64});
            }
        });
    }).catch((err) => {
        callback(500, err);
    });
};

chatModel.setAdminlastRead = function (uid, callback){
    const db = db_tools.getDBConection();
    db.collection('admin').doc(uid).get()
        .then( (doc) => {
            if (!doc.exists) callback(500, "No document found");
            else {
                doc.ref.update({
                   lastRead: Date.now()
                });
                callback(null, "updated ok");
            }
        }).catch( (err) => {
            callback(500, err);
        });
};

chatModel.getAdminLastRead = function (uid, callback) {
    const db = db_tools.getDBConection();
    db.collection('admin').doc(uid).get()
        .then(doc => {
            callback(null, doc.data().lastRead);
        }).catch(err => {
            callback(500, err);
        });
};

module.exports = chatModel;