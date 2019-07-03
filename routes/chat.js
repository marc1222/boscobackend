'use strict';

const express = require('express');
const api = express.Router();

const chatModel = require('../models/chat');
const middleware = require('../middlewares/authenticated');
const pushMessaging = require('../utils/sendpush');

const multipart = require('connect-multiparty');
const md_upload = multipart({uploadDir: './uploads/chat'});
/**
 ***************************** GETTERS *****************************
 */

/**
 * Get chat operario _>  params.first <= params.last
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
 * Get chat operario _>  params.first <= params.last
 */
api.get('/chatAdmin', middleware.ensureAdminAuth, function(req, res) {
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
 *
 */
api.get('/downloadChatOperario', middleware.ensureAuth, function (req, res) {
    const name = req.query.name;
    if (name !== undefined) {
        chatModel.downlaodFromChatGCS(name, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    }
});
/**
 *
 */
api.get('/downloadChatAdmin', middleware.ensureAdminAuth, function (req, res) {
    const name = req.query.name;
    if (name !== undefined) {
        chatModel.downlaodFromChatGCS(name, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    }
});

/**
 *
 */
api.get('/lastReadMsg', middleware.ensureAdminAuth, function (req, res) {
    chatModel.getAdminLastRead(req.uid, (error, data) => {
        if (error === null) res.status(200).send({success: true, result: data});
        else res.status(error).send({success: false, result: data});
    });
});

/**
 ***************************** POST *****************************
 */

/**
 *
 */
api.post('/uploadChatOperario', [middleware.ensureAuth, md_upload], function (req, res) {
    if (req.files.imagen) {
        chatModel.uploadToChatGCS(req.files.imagen, req.uid, true, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    }
});

/**
 *
 */
api.post('/uploadChatAdmin', [middleware.ensureAdminAuth, md_upload], function (req, res) {
    if (req.files.imagen && req.body.operario !== undefined) {
        chatModel.uploadToChatGCS(req.files.imagen, req.body.operario, false, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    }
});

/**
 * Send msg from operario to admin _> FCM
 */
api.post('/sendMsgOperario', middleware.ensureAuth, function(req, res) {
    const msg = req.body.message;
    if (msg !== undefined) {
        pushMessaging.adminChatToken( (error, adminChatToken) => {
            if (error === null) {
                //SEND  PUSH TO ADMIN VIA FCM
                console.log(adminChatToken);
                chatModel.sendPushToAdmin(msg, "false", adminChatToken, req.uid);
                res.status(200).send({success: true, result: "ok"});
            } else {
                res.status(error).send({success: false, result: adminChatToken});
            }
        });
    } else {
        res.status(500).send({success: false, result: "Bad request"});
    }
});

/**
 * Send msg from  admin to operario -> EXPO
 */
api.post('/sendMsgAdmin', middleware.ensureAdminAuth, function(req, res) {
    const Operario = req.body.operario;
    const msg = req.body.message;
    if (Operario !== undefined && msg !== undefined) {
        pushMessaging.operarioChatToken(Operario, (error, dest_token) => {
            if (error === null) {
                chatModel.sendMsgToOperario(msg, "false", dest_token, Operario);
                res.status(200).send({success: true, result: "ok"});
            } else {
                res.status(error).send({success: false, result: dest_token});
            }
        });
    } else {
        res.status(400).send({success: false, result: "Bad request"});
    }
});

/**
 ***************************** UPDATES *****************************
 */

/**
 * Update register token from user -> OPERARI, not ADMIN
 */
api.put('/chatToken', middleware.ensureAuth, function(req, res) {
    const chatToken = req.body.chatToken;
    if (chatToken !== undefined) {
        const params = {
            chatToken: chatToken,
            uid: req.uid
        };
        chatModel.updateToken(params, (error, result) => {
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
 * Update register token from user ADMIN
 */
api.put('/chatAdminToken', middleware.ensureAdminAuth, function(req, res) {
    const chatToken = req.body.chatToken;
    if (chatToken !== undefined) {
        const params = {
            chatToken: chatToken,
            uid: req.uid
        };
        chatModel.updateAdminToken(params, (error, result) => {
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
 *
 */
api.put('/lastReadMsg', middleware.ensureAdminAuth, function (req, res) {
    chatModel.setAdminlastRead(req.uid, (error, result) => {
        if (error === null) res.status(200).send({success: true, result: result});
        else res.status(error).send({success: false, result: result});
    });
});

module.exports = api;


