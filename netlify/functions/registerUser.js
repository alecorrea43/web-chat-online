const {MongoClient}= require('mongodb')
require('dotenv').config(); // Importa las variables de entorno desde .env
const User = require('../../src/Pages/User'); // Importa el modelo de usuario


const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;
const collectionName = process.env.MONGODB_COLLECTION;

let client;

exports.handler = async (event, context) => {
  try {
    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
    }

    const { name, email, password } = JSON.parse(event.body);

    // Validar datos de entrada
    if (!name || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan campos obligatorios.' }),
      };
    }

    // Verificar si el usuario ya está registrado
    const existingUser = await client.db(dbName).collection(collectionName).findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El correo electrónico ya está registrado.' }),
      };
    }

    // Crear un nuevo usuario
    const newUser = new User({ name, email, password });
    await client.db(dbName).collection(collectionName).insertOne(newUser);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Registro exitoso.' }),
    };
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Hubo un error al procesar la solicitud.' }),
    };
  }
};