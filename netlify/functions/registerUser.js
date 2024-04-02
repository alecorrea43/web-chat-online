require('dotenv').config(); // Importa las variables de entorno desde .env
const mongoose = require('mongoose');
const User = require('../../src/Pages/User'); // Importa el modelo de usuario

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; // Permite cerrar la conexión después de la operación

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Hubo un error al procesar la solicitud.' }),
    };
  } finally {
    // Cierra la conexión de MongoDB al finalizar la operación
    await mongoose.connection.close();
  }
};
