'use strict';

const admin = require('firebase-admin');

var bucket;

exports.getBucketConection = function () {
    if (bucket) return bucket;
    else {
        bucket = admin.storage().bucket("gs://bosco2.appspot.com");
        if (bucket) return bucket;
    }
    console.log("NO STORAGE!!!");
};

exports.ext = function () {
    const extTypes = {
        "doc"   : "application/msword"
        , "dot"   : "application/msword"
        , "gif"   : "image/gif"
        , "htm"   : "text/html"
        , "html"  : "text/html"
        , "ico"   : "image/vnd.microsoft.icon"
        , "jpeg"  : "image/jpeg"
        , "jpg"   : "image/jpeg"
        , "js"    : "application/javascript"
        , "json"  : "application/json"
        , "odp"   : "application/vnd.oasis.opendocument.presentation"
        , "ods"   : "application/vnd.oasis.opendocument.spreadsheet"
        , "odt"   : "application/vnd.oasis.opendocument.text"
        , "pdf"   : "application/pdf"
        , "png"   : "image/png"
        , "txt"   : "text/plain"
    };
    return {
        getExt: function (path) {
            var i = path.lastIndexOf('.');
            return (i < 0) ? '' : path.substr(i).replace('.','');
        },
        getContentType: function (ext) {
            return (extTypes[ext.toLowerCase()] !== undefined)?extTypes[ext.toLowerCase()]:'application/octet-stream';
        }
    };
};