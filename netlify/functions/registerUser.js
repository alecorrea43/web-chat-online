const mongoose = require('mongoose');
const User = require('../../src/Pages/User'); // Asegúrate de ajustar la ruta según tu estructura de archivos

exports.handler = async (event, context) => {
 if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
 }

 try {
    // Conectar a la base de datos
    await connectDB();

    // Parsear el cuerpo de la solicitud
    const { name, email, password } = JSON.parse(event.body);

    // Crear un nuevo usuario
    const user = new User({ name, email, password });
    await user.save();

    // Responder con éxito
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuario registrado con éxito" }),
    };
 } catch (error) {
    console.error(error);
    // Responder con error
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al registrar el usuario" }),
    };
 }
};

async function connectDB() {
 try {
    const mongoDBURL = process.env.MONGODB_URL;
    await mongoose.connect(mongoDBURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conexión a MongoDB establecida correctamente');
 } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
    process.exit(1);
 }
}