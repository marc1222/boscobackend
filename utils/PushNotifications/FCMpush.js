'use strict';

const admin = require('firebase-admin');
var fcm_messaging;

/**
 *
 * @param chatToken -> var notification = {
                      data: {

                      },
                      token: registrationToken
                    };
 * @param payload -> message
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