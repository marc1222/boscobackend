'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const admin = require('firebase-admin');
const serviceAccount = require('./Key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//cargar rutas
//ADMIN ROUTES FILES
const admin_service_route = require('./routes/admin/servicio');
const admin_auth_route = require('./routes/admin/auth');
const admin_chat_route = require('./routes/admin/chat');
const admin_cliente_route = require('./routes/admin/cliente');
const admin_operario_route = require('./routes/admin/operario');
const admin_factura_route = require('./routes/admin/factura');
//USER ROUTES FILES
const user_service_route = require('./routes/user/servicio');
const user_chat_route = require('./routes/user/chat');
const user_cliente_route = require('./routes/user/cliente');
const user_operario_route = require('./routes/user/operario');


app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb', extended: true}));


//configurar cabeceras http
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'token, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

  next();
});

app.use('/api', admin_service_route);
app.use('/api', admin_chat_route);
app.use('/api', admin_auth_route);
app.use('/api', admin_cliente_route);
app.use('/api', admin_operario_route);
app.use('/api', admin_factura_route);

app.use('/api', user_service_route);
app.use('/api', user_chat_route);
app.use('/api', user_cliente_route);
app.use('/api', user_operario_route);

module.exports = app;
