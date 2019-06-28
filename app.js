'use strict'

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

//cargar rutas
//var auth_route = require('./routes/auth');
const service_route = require('./routes/service');
const auth_route = require('./routes/auth');
const chat_route = require('./routes/chat');
const cliente_route = require('./routes/cliente');
const operario_route = require('./routes/operario');
const factura_route = require('./routes/factura');
const storage_route = require('./routes/storage');

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

//rutas base

app.use('/api', service_route);
app.use('/api', chat_route);
app.use('/api', auth_route);
app.use('/api', cliente_route);
app.use('/api', operario_route);
app.use('/api', factura_route);
app.use('/api', storage_route);

const admin = require('firebase-admin');
const serviceAccount = require('./Key.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});


module.exports = app;
