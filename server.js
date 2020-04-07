'use strict';

const express = require('express');
const app = express();
const http = require('http');
const config = require('config');
const swaggerUi = require('swagger-ui-express');
const swaggerTools = require('swagger-tools');
const jsyaml = require('js-yaml');
const fs = require('fs');
const admin = require('firebase-admin');
const {ErrorHandler, configure} = require('./helpers/error-utils');
const {setFirestoreDb} = require('./models');
const serverPort = (config.has('server.port')) ? config.get('server.port') : 3005;
// swaggerRouter configuration
var options = {
  swaggerUi: __dirname + '/app/swagger.json',
  controllers: __dirname + '/controllers',
  useStubs: process.env.NODE_ENV === 'development'
};

// eslint-disable-next-line no-sync
var spec = fs.readFileSync(__dirname + '/app/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

const errorHandlerConfig = {
  client_errors: config.get('client_errors')
};
configure(errorHandlerConfig);

const serviceAccount = require('./cert/service_key');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
setFirestoreDb(admin.firestore());

swaggerTools.initializeMiddleware(swaggerDoc, (middleware) => {

  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

  app.use((err, req, res, next) => {
    ErrorHandler.onError(err, req, res, next);
  });

});

// Start the server
http.createServer(app).listen(serverPort, function createFunc() {
  // eslint-disable-next-line no-console
  console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
  // eslint-disable-next-line no-console
  console.log('Swagger-ui is available on http://localhost:%d/api-docs', serverPort);
});