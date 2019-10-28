'use strict';

const config = require('../../config');
const db = config.getDBConection();
/**
 * Get admin chat token to send token to them
 * @param callback - return array where a pos is like: [i] -> {chatToken: xxx_chatTokenValue_xxx}
 */
exports.adminChatToken = (callback) => {
    var adminChatToken;
    db.collection('admin').get()
        .then(snapshot => {
            const docs = snapshot._docs();
            for (const doc of docs) {
                adminChatToken = doc.data().chatToken;
            }
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
        db.collection('operario').doc(uid).get()
            .then(user => {
                if (!user.exists) callback(500, "Not found user");
                else callback(null, user.data().chatToken);
            }).catch(err => {
                callback(500, err.message);
            });
    } else callback(500, "No uid defined when getting operario chat token");
};
