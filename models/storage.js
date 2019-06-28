'use strict';

const db_tools = require("../utils/db");
const gcs = require('../utils/gcs');

const storageModel = {};

storageModel.upload = (files, callback) => {
    console.log("Jdjdj");
    callback(null, "uploaded ok");
};

exports.module = storageModel;