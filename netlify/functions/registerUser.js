const {MongoClient}= require('mongodb')
require('dotenv').config(); // Importa las variables de entorno desde .env
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const User = require('../../src/Pages/User'); // Importa el modelo de usuario
const client = mongoClient.connect();

exports.handler = async (event, context) => {
  try {
    await client.connect();
    const { name, email, password } = JSON.parse(event.body);

    // Validar datos de entrada
    if (!name || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan campos obligatorios.' }),
      };
    }

    // Verificar si el usuario ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El correo electrónico ya está registrado.' }),
      };
    }

    // Crear un nuevo usuario
    const newUser = new User({ name, email, password });
    await newUser.save();

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
  } finally {
    await client.close();
  }
};