'use strict';

const express = require('express');
const api = express.Router();

const storageModel = require('../models/storage');
const middleware = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/'});

api.post('/uploadOperario', middleware.ensureAuth, function (req, res) {
    if (req.file && req.file.gcsUrl && (req.body.type === "service" || req.body.type === "chat") ) {
        storageModel.uploadToGCS(req.file, req.body.type, (error, data) => {
            if (error === null) res.status(200).send({success: true, result: data});
            else res.status(error).send({success: false, result: data});
        });
    }
});

// api.post('/uploadAdmin', middleware.ensureAdminAuth, function (req, res) {
//
// });

module.exports = api;