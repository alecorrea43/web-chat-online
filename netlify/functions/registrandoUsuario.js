const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const { google } = require('googleapis');
require('dotenv').config();

exports.handler = async (event, context) => {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
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

        const oAuth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT_URI
        );
        oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        const rawMessage = makeBody(
            userData.email,
            process.env.GMAIL_USERNAME,
            'Bienvenido a nuestra página web',
            `Hola ${userData.name}, gracias por registrarte en nuestra página web. ¡Esperamos que disfrutes de nuestros servicios!`
        );

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage,
            },
        });

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
