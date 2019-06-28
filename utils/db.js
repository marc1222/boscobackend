'use strict';

const admin = require('firebase-admin');

var db;

exports.getDBConection = function () {
    if (db) return db;
    else {
        db = admin.firestore();
        if (db) return db;
    }
    console.log("NO DB!!!");
};