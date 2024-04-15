const { MongoClient } = require('mongodb');
require('dotenv').config();

exports.handler = async function(event, context) {
 if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
 }

 // Conectar a MongoDB
 const uri = process.env.MONGODB_URI;
 const client = new MongoClient(uri);
 await client.connect();

 const db = client.db("test");
 const usersCollection = db.collection("users");

 // Buscar todos los usuarios
 const allUsers = await usersCollection.find({}).toArray();

 // Extraer solo los nombres de los usuarios
 const userNames = allUsers.map(user => user.name);

 return {
    statusCode: 200,
    body: JSON.stringify({ userNames })
 };
};