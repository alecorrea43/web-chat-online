const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('../../src/Pages/User'); // Asegúrate de ajustar la ruta al modelo de usuario

// Configuración de Nodemailer
let transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
    user: process.env.GMAIL_USERNAME, // Tu dirección de correo electrónico de Gmail
    pass: process.env.GMAIL_PASSWORD, // Tu contraseña de Gmail
 },
});

exports.handler = async (event, context) => {
    const uri = process.env.MONGODB_URI; // Asegúrate de tener esta variable de entorno configurada
    const client = new MongoClient(uri);

    try {
        await client.connect();
        // Asegúrate de reemplazar "nombreDeTuBaseDeDatos" con el nombre real de tu base de datos
        const db = client.db("test"); 
        // Cifrar la contraseña antes de guardarla
        const saltRounds = 10; // Número de rondas para el cifrado
        const userData = JSON.parse(event.body);
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        userData.password = hashedPassword; // Reemplazar la contraseña en texto plano con la cifrada

        // Crear un nuevo usuario utilizando el modelo de Mongoose
        const newUser = new User(userData);
        await newUser.save();

        console.log(`Usuario insertado con el _id: ${newUser._id}`);

        // Enviar correo electrónico de confirmación
        const mailOptions = {
            from: process.env.GMAIL_USERNAME,
            to: userData.email,
            subject: 'Registro exitoso',
            text: 'Gracias por registrarte en nuestra aplicación.',
            html: '<p>Gracias por registrarte en nuestra aplicación.</p>',
        };

        await transporter.sendMail(mailOptions);

    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error al insertar el usuario" }),
        };
    } finally {
        await client.close();
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Usuario registrado exitosamente" }),
    };
};
