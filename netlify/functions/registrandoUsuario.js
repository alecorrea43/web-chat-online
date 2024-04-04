const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const awsServerlessExpress = require('aws-serverless-express');
const cors = require('cors');


const app = express();

app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(process.env.MONGODB_URI);

// Aquí puedes agregar tus rutas y lógica de negocio
// Por ejemplo, una ruta simple que devuelve un mensaje
app.get('/hello', (req, res) => {
   res.send('Hello World!');
  });
  
  // Crear un servidor con aws-serverless-express
  const server = awsServerlessExpress.createServer(app);
  
  // Exportar la función handler para AWS Lambda
  exports.handler = (event, context) => {
   // Proxy el evento y el contexto a aws-serverless-express
   return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
  };