'use strict';

const db_tools = require("../utils/db");

const { Expo } = require('expo-server-sdk');

const admin = require('firebase-admin');

var fcm_messaging;

var expo_messaging;

/**
 * Get admin chat token to send token to them
 * @param callback - return array where a pos is like: [i] -> {chatToken: xxx_chatTokenValue_xxx}
 */
exports.adminChatToken = (callback) => {
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
exports.operarioChatToken = (uid, callback) => {
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

/**
 *
 * @param notification -> var notification = {
                      data: {

                      },
                      token: registrationToken
                    };
 * @param callback -> callback returning ID message or error descreition
 */
exports.sendPushNotificationFCM = function (chatToken, payload) {
    if (!fcm_messaging) fcm_messaging = admin.messaging();
    if (fcm_messaging) {
        fcm_messaging.sendToDevice(chatToken, payload)
            .then((response) => {
                // Response is a message ID string.
                console.log("message correctly received for app",response);
            })
            .catch((error) => {
                console.log("message not received for app",error);
            });
    }
    else {
       console.log("Not FCM messaging initializated");
    }
};
/**
 * Sends an expo notifaction to pushToken
 * @param notification = {
                            to: pushToken,
                            sound: 'default',
                            body: 'This is a test notification',
                            data: { msg: 'data' },
                          }
 * @param callback
 */
exports.sendPushNotificationExpo = function (notification) {
    if (!expo_messaging) expo_messaging = new Expo();
    if (expo_messaging) {
       let isPushToken = Expo.isExpoPushToken(notification.to);
       if (isPushToken) {
            var notifications_array = [];
            notifications_array[0] = notification;
            expo_messaging.sendPushNotificationsAsync(notifications_array)
                .then(res => {
                    console.log(res);
                    if (res[0].status === 'ok') {
                        console.log("went ok");
                    }
                    else console.log("went bad");
                   // callback(null, {success: true} );
                }).catch( err => {
                    console.log("NOT went ok");
                    console.log(err);
                 //   callback(null, {success: false});
                });
       } else {
           console.log( "Wrong push token");
           //callback(500, "Wrong push token");
       }
    } else {
        console.log("Not EXPO messaging initializated");
     //   callback(500, "Not EXPO messaging initializated");
    }
};