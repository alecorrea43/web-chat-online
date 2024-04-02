require('dotenv').config(); // Importa las variables de entorno desde .env
const mongoose = require('mongoose');
const User = require('../../src/Pages/User'); // Importa el modelo de usuario
const connectDB = require('../../mongodb'); // Importa la función de conexión a MongoDB

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; // Permite cerrar la conexión después de la operación

  try {
    console.log('Intentando conectar a la base de datos...');
    await connectDB(); // Conecta a la base de datos MongoDB
    console.log('Conexión exitosa.');
    const { name, email, password } = JSON.parse(event.body);

    // Verifica si el usuario ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El correo electrónico ya está registrado.' }),
      };
    }

    // Crea un nuevo usuario
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
    // Cierra la conexión de MongoDB al finalizar la operación
    await mongoose.connection.close();
  }
};