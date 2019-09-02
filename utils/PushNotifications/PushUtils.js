'use strict';

const config = require('../../config');

/**
 * Get admin chat token to send token to them
 * @param callback - return array where a pos is like: [i] -> {chatToken: xxx_chatTokenValue_xxx}
 */
exports.adminChatToken = (callback) => {
    const db = config.getDBConection();
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
 * Get ChatToken of the user with uid == uid
 * @param uid - uid of user to get chatToken
 * @param callback - return chatToken, or error
 */
exports.operarioChatToken = (uid, callback) => {
    if (uid !== null) {
        const db = config.getDBConection();
        db.collection('operario').doc(uid).get()
            .then(user => {
                callback(null, user.data().chatToken);
            }).catch(err => {
            callback(500, err.message);
        });
    } else callback(500, "No uid defined when getting operario chat token");
};
