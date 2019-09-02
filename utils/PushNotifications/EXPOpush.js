'use strict';

const { Expo } = require('expo-server-sdk');
var expo_messaging;

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
                   // callback(null, {success: true} ); NO CALLBACK RETURNED BY THIS FUNCTION!!!
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