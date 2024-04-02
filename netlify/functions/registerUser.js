const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const User = require("../../src/Componentes/User"); // Asegúrate de que esta ruta sea correcta
const connectDB = require("../../mongodb"); // Asegúrate de que esta ruta sea correcta
require('dotenv').config();

exports.handler = async (event, context) => {
 // Configura CORS para permitir solicitudes desde tu dominio de origen
 const headers = {
  "Access-Control-Allow-Origin": "*", // Ajusta esto según sea necesario
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST"
};

 // Maneja la solicitud OPTIONS para CORS
 if (event.httpMethod === "POST") {
    return {
      statusCode: 200,
      headers,
      body: "CORS headers set"
    };
 }

 // Parsea el cuerpo de la solicitud
 const body = JSON.parse(event.body);
 const { name, email, password } = body;

 if (!name || !email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Todos los campos son obligatorios." }),
    };
 }

 try {
    await connectDB(); // Conecta a tu base de datos

    const existingUser = await User.findOne({ $or: [{ name }, { email }] });

    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: existingUser.name === name
            ? "El nombre de usuario ya está en uso, elige otro."
            : "El correo ya ha sido registrado, crea otro o inicia sesión.",
        }),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Envía un correo de confirmación
    await sendConfirmationEmail(email);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuario registrado exitosamente" }),
    };
 } catch (err) {
    console.error("Error en la función de registro:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Ha ocurrido algún error. Por favor, vuelve a intentarlo." }),
    };
 }
};

async function sendConfirmationEmail(email) {
 const msg = {
    to: email,
    from: process.env.GMAIL_USERNAME,
    subject: "Registro exitoso",
    text: "Gracias por registrarte en nuestra aplicación.",
    html: "<p>Gracias por registrarte en nuestra aplicación.</p>",
 };

 try {
    const info = await nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
      },
    }).sendMail(msg);
    console.log("Correo electrónico enviado. Respuesta del servidor:", info);
 } catch (error) {
    console.error("Error al enviar el correo de confirmación:", error);
 }
}