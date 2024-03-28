const nodemailer = require('nodemailer');
const User = require('./src/Componentes/User.js'); // Asegúrate de que la ruta sea correcta
const bcrypt = require('bcrypt');
const connectDB = require("/mongodb");

exports.handler = async function(event, context) {

  await connectDB();

 if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
 }

 const { name, email, password } = JSON.parse(event.body);

 // Aquí va tu lógica de registro y envío de correo
 // Por ejemplo:
 try {
    const existingUser = await User.findOne({ $or: [{ name }, { email }] });

    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "El usuario ya existe" }),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Aquí va tu lógica para enviar el correo de confirmación
    // Por ejemplo:
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const msg = {
      to: email,
      from: process.env.GMAIL_USERNAME,
      subject: "Registro exitoso",
      text: "Gracias por registrarte en nuestra aplicación.",
      html: "<p>Gracias por registrarte en nuestra aplicación.</p>",
    };

    await transporter.sendMail(msg);

    // Agrega los encabezados de CORS a la respuesta
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Permite solicitudes desde cualquier origen
        "Access-Control-Allow-Headers": "Content-Type", // Permite el encabezado Content-Type
      },
      body: JSON.stringify({ message: "Usuario registrado exitosamente" }),
    };
 } catch (error) {
    console.error("Error al registrar el usuario:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Permite solicitudes desde cualquier origen
        "Access-Control-Allow-Headers": "Content-Type", // Permite el encabezado Content-Type
      },
      body: JSON.stringify({ error: "Error al registrar el usuario" }),
    };
 }
};