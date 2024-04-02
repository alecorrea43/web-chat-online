const connectDB = require('../../mongodb');
const User = require('../../src/Pages/User'); // Asegúrate de que la ruta sea correcta
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
 },
});

exports.handler = async function(event, context) {
 if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
 }

 const { name, email, password } = JSON.parse(event.body);

 if (!name || !email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Todos los campos son obligatorios.' }),
    };
 }

 try {
    // Asegurarse de que la base de datos esté conectada
    await connectDB();

    const existingUser = await User.findOne({ $or: [{ name }, { email }] });

    if (existingUser) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          error:
            existingUser.name === name
              ? 'El nombre de usuario ya está en uso, elige otro.'
              : 'El correo ya ha sido registrado, crea otro o inicia sesión.',
        }),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Enviar correo de confirmación
    const mailOptions = {
      from: process.env.GMAIL_USERNAME,
      to: email,
      subject: 'Registro exitoso',
      text: `Hola ${name}, gracias por registrarte en nuestra aplicación.`,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Usuario registrado exitosamente y correo enviado' }),
    };
 } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Ha ocurrido algún error. Por favor, vuelve a intentarlo.',
      }),
    };
 }
};