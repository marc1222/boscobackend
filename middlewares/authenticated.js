'use strict';

const admin = require('firebase-admin');

exports.ensureAuth = function(req, res, next) {
  const auth_token = req.header('token');
  if (auth_token !== undefined) {
    admin.auth().verifyIdToken(auth_token).then((decodedToken) => {
      req.uid = decodedToken.uid;
      next();
    }).catch(function(error) {
      return res.status(403).send({success: false, result: "Access denied"});
    });
  } else return res.status(400).send({success: false, result: "Bad request"});

};

exports.ensureAdminAuth = function(req, res, next) {
  const auth_token = req.header('token');
  if (auth_token !== undefined) {
    admin.auth().verifyIdToken(auth_token).then((decodedToken) => {
      if (decodedToken.adminUser ===  true) {
        req.uid = decodedToken.uid;
        next();
      } else {
        return res.status(403).send({success: false, result: "Access denied"});
      }
    }).catch(function(error) {
      return res.status(403).send({success: false, result: "Access denied"});
    });
  } else return res.status(400).send({success: false, result: "Bad request"});
};
