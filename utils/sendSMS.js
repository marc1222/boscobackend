const request = require('request');

exports.sendSMS = (phoneDest, msg) => {
    const mensatekMail = 'mguinovart@owius.com';
    const mensatekPass = '8903374';
    const remitent = 'Bosco';
    msg = encodeURIComponent(msg);
    request({
        url: 'http://api.mensatek.com/sms/v5/enviar.php?Correo='+mensatekMail+'&Passwd='+mensatekPass+'&Remitente='+remitent+'&Destinatarios='+phoneDest+'&Mensaje='+msg+'&Resp=JSON',
        method: 'GET',
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });

};

// api.get('/sendSMS', middleware.ensureAuth, (req, res) => {
//     const sms = require('../../utils/sendSMS');
//     sms.sendSMS('34648733799', 'Este es un bonito mensaje que espero que se envie bien OMG!!');
//     res.status(200).send("OOOOOK");
// });
