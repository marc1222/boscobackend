'use strict';

const admin = require('firebase-admin');
const express = require('express');

var db;
var bucket;

exports.getDBConection = function () {
    if (db) return db;
    else {
        db = admin.firestore();
        if (db) return db;
    }
    console.log("NO DataBase connection!!!");
};

exports.getBucketConection = function () {
    if (bucket) return bucket;
    else {
        bucket = admin.storage().bucket("gs://bosco2.appspot.com");
        if (bucket) return bucket;
    }
    console.log("NO Storage connection!!!");
};

exports.getExpress = function () {
    return express.Router();
};