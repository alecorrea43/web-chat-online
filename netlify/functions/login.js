const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.handler = async function(event, context) {
 if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
 }

 const { username, password } = JSON.parse(event.body);

 // Conectar a MongoDB
 const uri = process.env.MONGODB_URI;
 const client = new MongoClient(uri);
 await client.connect();

 const db = client.db("test");
 const usersCollection = db.collection("users");

 // Buscar al usuario en la base de datos
 const user = await usersCollection.findOne({ $or: [{ name: username }, { email: username }] });
 if (!user || !(await bcrypt.compare(password, user.password))) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Usuario o correo incorrectas." })
    };
 }

 // Actualizar el estado de los usuarios conectados en MongoDB
 await usersCollection.updateOne({ email: user.email }, { $set: { connected: true } });

 // Generar y devolver un token JWT
 const token = jwt.sign({ username: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

 return {
    statusCode: 200,
    body: JSON.stringify({ 
      token, 
      username: user.name || username,
      email: user.email,
      name: user.name 
    })
 };
};