const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const { google } = require('googleapis');
require('dotenv').config();

// Configuración inicial del cliente OAuth2
const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);

// Función para generar la URL de autorización
exports.getAuthUrl = async function(event, context) {
    try {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/gmail.send']
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ authUrl })
        };
    } catch (error) {
        console.error('Error al generar la URL de autenticación', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error al generar la URL de autenticación' })
        };
    }
};

// Función principal para manejar el registro de usuarios
exports.handler = async (event, context) => {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Conectado a la base de datos MongoDB');
        
        const collection = client.db("test").collection("users");
        let userData = JSON.parse(event.body);

        const existingUser = await collection.findOne({
            $or: [
                { name: userData.name },
                { email: userData.email }
            ]
        });

        if (existingUser) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    error: existingUser.name === userData.name
                        ? "El nombre de usuario ya está en uso, elige otro."
                        : "El correo ya ha sido registrado, crea otro o inicia sesión.",
                }),
            };
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        userData.password = hashedPassword;
        userData.connected = false;

        const result = await collection.insertOne(userData);
        console.log(`Usuario insertado con el _id: ${result.insertedId}`);

        console.log('Configurando el cliente OAuth2 con el token de refresco');
        oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        console.log('Enviando correo con los siguientes detalles:');
        console.log(`Para: ${userData.email}`);
        console.log(`Asunto: Bienvenido a nuestra página web`);
        console.log(`Mensaje: Hola ${userData.name}, gracias por registrarte en nuestra página web. ¡Esperamos que disfrutes de nuestros servicios!`);

        const rawMessage = makeBody(
            userData.email,
            process.env.GMAIL_USERNAME,
            'Bienvenido a nuestra página web',
            `Hola ${userData.name}, gracias por registrarte en nuestra página web. ¡Esperamos que disfrutes de nuestros servicios!`
        );

        console.log('Mensaje codificado:', rawMessage);

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage,
            },
        });
        console.log('Respuesta del envío de correo:', response.data);

    } catch (e) {
        console.error('Error durante el proceso:', e);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error al insertar el usuario o enviar el correo" }),
        };
    } finally {
        await client.close();
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Usuario registrado exitosamente" }),
    };
};

// Función para codificar el mensaje en base64
function makeBody(to, from, subject, message) {
    const str = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${subject}`,
        '',
        message,
    ].join('\n');

    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}
