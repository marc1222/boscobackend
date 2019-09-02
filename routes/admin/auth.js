'use strict';

const config = require('../../config');
const api = config.getExpress();

const auth = require('../../core/auth');

//--------------------------------------------------------------------------//

api.post('/authAdmin', function (req,res) {
    const token = req.header('token');
    if (token !== undefined ) {
        auth.validateAdmin(token, (error, data) => {
            if (error === null) {
                auth.createAdminCustomToken(data, (error, data) => {
                    if (error === null) {
                        res.status(200).send({success: true, result: data});
                    } else {
                        res.status(error).send({success: false, result: data});
                    }
                });
            } else res.status(error).send({success: false, result: data});
        });
    } else res.status(400).send({success: false, result: "No token sent"});
});

module.exports = api;