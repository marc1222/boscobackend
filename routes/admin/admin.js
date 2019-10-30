const config = require('../../config');
const api = config.getExpress();

const middleware = require('../../middlewares/admin_auth');
const admin = require('firebase-admin');
const db_general = require('../../orm/general_model');
const constant = require('../../utils/define');


api.get('/admin', middleware.ensureAuth, (req, res) => {
   db_general.getCollection(constant.AdminCollection, (error, result) => {
      if (error) res.status(error).send({success: false, result: result});
      else res.status(200).send({success: true, result: result});
   });
});

function createAdmin(email, pass, name, callback) {

    admin.auth().createUser({
        email: email,
        password: pass
    }).then(function(userRecord) {
        const NewAdmin = {
            email: email,
            lastRead: Date.now(),
            nombre: name
        };
        db_general.addGenericDocWithId(constant.AdminCollection, userRecord.uid, NewAdmin,(error, result) => {
            if (error) callback(error, result);
            else callback(null, "ok");
        });
    }).catch(function(error) {
        callback(error.code, "Error creating new user:"+error);
    });
}

api.post('/admin', middleware.ensureAuth, (req, res) => {
    const body = req.body;
    if (body.email !== undefined && body.pass !== undefined && body.name !== undefined) {
        createAdmin(body.email, body.pass, body.name,(error, result) => {
            if (error) res.status(error).send({success: false, result: result});
            else res.status(200).send({success: true, result: "added admin ok"});
        });
    } else res.status(400).send({success: false, result: "Bad request"});
});

module.exports = api;
