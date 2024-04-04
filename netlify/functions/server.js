const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const awsServerlessExpress = require('aws-serverless-express');
const cors = require('cors');


const app = express();

app.use(cors({
   origin: 'https://web-chat-online.netlify.app/register' // Solo permite solicitudes desde http://example.com
  }));
app.use(bodyParser.json());

const client = new MongoClient(process.env.MONGODB_URI);

app.post('/register', async (req, res) => {
 try {
    await client.connect();
    const collection = client.db("test").collection("users");
    const user = req.body;
    const result = await collection.insertOne(user);
    res.status(200).json({ message: "User registered successfully", userId: result.insertedId });
 } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering user" });
 } finally {
    await client.close();
 }
});

// Crear un servidor con aws-serverless-express
const server = awsServerlessExpress.createServer(app);

// Exportar la función handler para AWS Lambda
exports.handler = (event, context) => {
 // Proxy el evento y el contexto a aws-serverless-express
 return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};