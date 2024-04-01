const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const User = require("../../src/Componentes/User");
const connectDB = require("../../mongodb");

const app = express();
app.use(bodyParser.json());

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
 service: "gmail",
 auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
 },
});

app.post('/', async (req, res) => {
 const { name, email, password } = req.body;

 if (!name || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
 }

 try {
    await connectDB(); // Conecta a tu base de datos

    const existingUser = await User.findOne({ $or: [{ name }, { email }] });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.name === name
          ? "El nombre de usuario ya está en uso, elige otro."
          : "El correo ya ha sido registrado, crea otro o inicia sesión.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Envía un correo de confirmación
    await sendConfirmationEmail(email);

    return res.json({ message: "Usuario registrado exitosamente" });
 } catch (err) {
    return res.status(500).json({ error: "Ha ocurrido algún error. Por favor, vuelve a intentarlo." });
 }
});

async function sendConfirmationEmail(email) {
 const msg = {
    to: email,
    from: process.env.GMAIL_USERNAME,
    subject: "Registro exitoso",
    text: "Gracias por registrarte en nuestra aplicación.",
    html: "<p>Gracias por registrarte en nuestra aplicación.</p>",
 };

 try {
    const info = await transporter.sendMail(msg);
    console.log("Correo electrónico enviado. Respuesta del servidor:", info);
 } catch (error) {
    console.error("Error al enviar el correo de confirmación:", error);
 }
}

exports.handler = app;