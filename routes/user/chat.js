'use strict';

const config = require('../../config');
const api = config.getExpress();

const chatModel = require('../../core/chat');
const middleware = require('../../middlewares/user_auth');

const pushMessaging = require('../../utils/PushNotifications/PushUtils');

const multipart = require('connect-multiparty');
const md_upload = multipart({uploadDir: './uploads/chat'});

//--------------------------------------------------------------------------//
/**
 * Get chat Operario call
 * Params required: first, last, first <= last
 */
api.get('/chat', middleware.ensureAuth, function(req, res) {
    const params = req.query;
    if (params.first !== undefined && params.last !== undefined && params.first <= params.last) {
        const chatData = {
            uid: req.uid,
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
 * Opeario call to download a document from /chat/ from google storage
 * Required params: name of file to donwload
 */
api.get('/downloadChatOperario', middleware.ensureAuth, function (req, res) {
    const name = req.query.name;
    if (name !== undefined) {
        chatModel.downlaodFromChatGCS(name, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

//--------------------------------------------------------------------------//

/**
 * Opeario call to upload to /chat/ folder on google storage an image
 * Required params: files.imagen (image)
 */
api.post('/uploadChatOperario', [middleware.ensureAuth, md_upload], function (req, res) {
    if (req.files.imagen) {
        chatModel.uploadToChatGCS(req.files.imagen, req.uid, true, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

/**
 * Opeario call to send a msg from operario to an Admin using Firebase Cloud Messaging (FCM)
 * Required params: message to send
 */
api.post('/sendMsgOperario', middleware.ensureAuth, function(req, res) {
    const msg = req.body.message;
    if (msg !== undefined) {
        chatModel.sendChatMsgToAdmin(msg, "false", req.uid, (error, data) => {
            if (error) res.status(error).send({success: false, result: data});
            else res.status(200).send({success: true, result: data});
        });
    } else {
        res.status(400).send({success: false, result: "Bad request"});
    }
});

//--------------------------------------------------------------------------//

/**
 * Update chatToken token from user OPERARI
 * Required Params: chatToken
 */
api.put('/chatToken', middleware.ensureAuth, function(req, res) {
    const chatToken = req.body.chatToken;
    if (chatToken !== undefined) {
        const params = {
            chatToken: chatToken,
            uid: req.uid
        };
        chatModel.updateToken('operario', params, (error, result) => {
            if (error === null) res.status(200).send({success: true, result: result});
            else res.status(error).send({success: false, result: result});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

module.exports = api;


