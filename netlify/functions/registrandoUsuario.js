const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('../../src/Pages/User'); // Asegúrate de ajustar la ruta al modelo de usuario

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
       user: process.env.GMAIL_USERNAME, // Tu dirección de correo electrónico de Gmail
       pass: process.env.GMAIL_PASSWORD, // Tu contraseña de Gmail
    },
   });
   
   exports.handler = async (event, context) => {
       const uri = process.env.MONGODB_URI; // Asegúrate de tener esta variable de entorno configurada
       const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
   
       try {
           await client.connect();
           const db = client.db("test"); // Asegúrate de reemplazar "nombreDeTuBaseDeDatos" con el nombre real de tu base de datos
   
           const userData = JSON.parse(event.body);
           const existingUser = await User.findOne({ $or: [{ name: userData.name }, { email: userData.email }] });
   
           if (existingUser) {
               return {
                   statusCode: 400,
                   body: JSON.stringify({
                       error: existingUser.name === userData.name
                           ? "El nombre de usuario ya está en uso, elige otro."
                           : "El correo ya ha sido registrado, crea otro o inicia sesión.",
                   }),
               };
           }
   
           const hashedPassword = await bcrypt.hash(userData.password, 10);
           const newUser = new User({ name: userData.name, email: userData.email, password: hashedPassword });
           await newUser.save();
   
           // Enviar correo electrónico de confirmación
           const mailOptions = {
               from: process.env.GMAIL_USERNAME,
               to: userData.email,
               subject: 'Registro exitoso',
               text: 'Gracias por registrarte en nuestra aplicación.',
               html: '<p>Gracias por registrarte en nuestra aplicación.</p>',
           };
   
           await transporter.sendMail(mailOptions);
   
           return {
               statusCode: 200,
               body: JSON.stringify({ message: "Usuario registrado exitosamente" }),
           };
       } catch (e) {
           console.error(e);
           return {
               statusCode: 500,
               body: JSON.stringify({ message: "Error al insertar el usuario" }),
           };
       } finally {
           await client.close();
       }
   };