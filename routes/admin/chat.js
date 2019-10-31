'use strict';

const config = require('../../config');
const api = config.getExpress();

const chatModel = require('../../core/chat');
const middleware = require('../../middlewares/admin_auth');

const constant = require('../../utils/define');
const pushFCM = require('../../utils/PushNotifications/FCMpush');


const multipart = require('connect-multiparty');
const md_upload = multipart({uploadDir: './uploads/chat'});

//--------------------------------------------------------------------------//
/**
 * Get chat Admin call
 * Params required: operario UID, first, last, first <= last
 */
api.get('/chatAdmin', middleware.ensureAuth, function(req, res) {
    const params = req.query;
    if (params.operario !== undefined && params.first !== undefined && params.last !== undefined && params.first <= params.last) {
        const chatData = {
            uid: params.operario,
            first: params.first,
            last: params.last
        };
        chatModel.getChat(chatData, (error, result) => {
            if (error === null)  res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Admin call to download a document from /chat/ from google storage
 * Required params: name of file to donwload
 */
api.get('/downloadChatAdmin', middleware.ensureAuth, function (req, res) {
    const name = req.query.name;
    if (name !== undefined) {
        chatModel.downlaodFromChatGCS(name, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    } else res.status(400).send({success: false, result: "Bad request"});

});

/**
 * Admin call to get the time that "last read" field from admin
 */
api.get('/lastReadMsg', middleware.ensureAuth, function (req, res) {
    chatModel.getAdminLastRead(req.uid, (error, data) => {
        if (error === null) res.status(200).send({success: true, result: data});
        else res.status(error).send({success: false, result: data});
    });
});

//--------------------------------------------------------------------------//

/**
 * Admin call to upload to /chat/ folder on google storage an image
 * Required params: files.imagen (image), operario Uid whose belongs
 */
api.post('/uploadChatAdmin', [middleware.ensureAuth, md_upload], function (req, res) {
    if (req.files.imagen && req.body.operario !== undefined) {
        chatModel.uploadToChatGCS(req.files.imagen, req.body.operario, false, (error, data) => {
            if (error === null) {
                pushFCM.propagateEventsBetweenAdmins(req.uid, constant.ChatCollection, 'null');
                res.status(200).send({success: true, result: data});
            }
            else res.status(error).send({success: false, result: data});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});


/**
 * Admin call to send a msg from  admin to an operario using EXPO
 * Required params: operario Uid to send msg, and the message to send
 */
api.post('/sendChatMsgToAdmin', middleware.ensureAuth, function(req, res) {
    const Operario = req.body.operario;
    const msg = req.body.message;
    if (Operario !== undefined && msg !== undefined) {
        chatModel.sendChatMsgToOperario(msg, "false", Operario, (error, data) => {
            if (error) res.status(error).send({success: false, result: data});
            else {
                pushFCM.propagateEventsBetweenAdmins(req.uid, constant.ChatCollection, 'null');
                res.status(200).send({success: true, result: data});
            }
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

//--------------------------------------------------------------------------//

/**
 * Admin call to update chatToken from Admin
 * Required params: chatToken
 */
api.put('/chatAdminToken', middleware.ensureAuth, function(req, res) {
    const chatToken = req.body.chatToken;
    if (chatToken !== undefined) {
        const params = {
            chatToken: chatToken,
            uid: req.uid
        };
        chatModel.updateToken(constant.AdminCollection, params, (error, result) => {
            if (error === null) {
                res.status(200).send({success: true, result: result});
            } else res.status(error).send({success: false, result: result});
        });
    }
    else {
        res.status(500).send({success: false, result: "Bad request"});
    }
});

/**
 * Admin call to update the field "lastRead" on admin table
 */
api.put('/lastReadMsg', middleware.ensureAuth, function (req, res) {
    chatModel.setAdminlastRead(req.uid, (error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: false, result: result});
    });
});

module.exports = api;


