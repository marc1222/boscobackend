'use strict';

const admin = require('firebase-admin');
var fcm_messaging = admin.messaging();


const constant = require('../../utils/define');

/**
 *
 * @param chatToken -> var notification = {
                      data: {

                      },
                      token: registrationToken
                    };
 * @param payload -> message
 */
// exports.sendPushNotificationFCM = function (chatToken, payload) {
//     if (!fcm_messaging) fcm_messaging = admin.messaging();
//     if (fcm_messaging) {
//         fcm_messaging.sendToDevice(chatToken, payload)
//             .then((response) => {
//                 // Response is a message ID string.
//                 console.log("message correctly received for app",response);
//             })
//             .catch((error) => {
//                 console.log("message not received for app",error);
//             });
//     }
//     else {
//         console.log("Not FCM messaging initializated");
//     }
// };

// var message = {
//     data: {
//         ....
//     },
//     topic: topic
// };
exports.sendPushNotificationFCM = function (payload) {

    fcm_messaging.send(payload)
        .then((response) => {
            // Response is a message ID string.
            console.log("message correctly received for app",response);
        })
        .catch((error) => {
            console.log("message not received for app",error);
        });

};


//TOPIC PUSHING -> .subscribeToTopic(registrationTokens, topic)
// UNPUSHING -> .unsubscribeFromTopic(registrationTokens, topic)
//registrationTokens -> [token1. . .... token n]
exports.topicSubscribe = (regToken, topic) => { //maybe callback be used
    fcm_messaging.subscribeToTopic([regToken], topic)
        .then(function(response) {
            // See the MessagingTopicManagementResponse reference documentation for the contents of response.
            //callback(null, "ok");
            console.log('Successfully subscribed to topic:', response);
        })
        .catch(function(error) {
            //callback(500, error);
            console.log('Error subscribing to topic:', error);
        });
};

exports.topicUnsubscribe = (regToken, topic) => { //maybe callback be used
    fcm_messaging.unsubscribeFromTopic([regToken], topic)
        .then(function(response) {
            // See the MessagingTopicManagementResponse reference documentation for the contents of response.
           // callback(null, "ok");
            console.log('Successfully subscribed to topic:', response);
        })
        .catch(function(error) {
         //   callback(500, error);
            console.log('Error subscribing to topic:', error);
        });
};

/**
 *
 * @param actionAdmin -> admin ID (document ID) that triggered that function
 * @param collectionModified -> collection that has been modified by actionAdmin
 * @param docID -> docID that has been added or updated belonging to collectionModified
 */
exports.propagateEventsBetweenAdmins = (actionAdmin, collectionModified, docID) => {
    const message = {
        data: {
            admin: actionAdmin,
            collection: collectionModified,
            document: docID
        },
        topic: constant.pushNotificationsTopic
    };

    sendPushNotificationFCM(message);
};

