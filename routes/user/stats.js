'use strict';

const config = require('../../config');
const api = config.getExpress();
const statsModel = require('../../core/stats');

const middleware = require('../../middlewares/user_auth');


api.get('/MyStats', middleware.ensureAuth, function(req, res) {
    statsModel.getStatsByOperario(req.uid, (error, result) => {
        if (error) res.status(error).send({success: false, result: result});
        else res.status(200).send({success: true, result: result});
    });
});

module.exports = api;
