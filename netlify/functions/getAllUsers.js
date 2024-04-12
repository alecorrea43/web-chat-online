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

 // Obtener todos los usuarios de la colección
 const users = await usersCollection.find({}).toArray();

 // Desconectar del cliente de MongoDB
 await client.close();

 // Devolver la lista de usuarios
 return {
    statusCode: 200,
    body: JSON.stringify(users)
 };
};