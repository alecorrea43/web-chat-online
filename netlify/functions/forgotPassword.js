const { MongoClient } = require('mongodb');
const crypto = require('crypto');
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

exports.handler = async (event, context) => {
    // Asegúrate de que el evento es una solicitud POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Método no permitido" }),
        };
    }

    // Parsear el cuerpo de la solicitud para obtener el correo electrónico
    const { email } = JSON.parse(event.body);

    if (!email) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "El campo de correo electrónico es obligatorio." }),
        };
    }

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const recoveryTokensCollection = client.db("test").collection("recoveryTokens");

        // Generar un token de recuperación
        const token = crypto.randomBytes(32).toString("hex");
        const expirationTime = new Date(Date.now() + 3600000); // 1 hora en el futuro

        // Almacenar el token de recuperación en la base de datos
        await recoveryTokensCollection.insertOne({
            email,
            token,
            expirationTime
        });

        // Enviar el correo electrónico con el enlace de recuperación
        const resetPasswordLink = `https://web-chatonline.netlify.app/reset-password/${token}`;

        // Configurar las credenciales del cliente OAuth2
        oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

        // Crear el cuerpo del mensaje en formato raw
        const rawMessage = makeBody(
            email,
            process.env.GMAIL_USERNAME,
            'Recuperación de Contraseña',
            `Hola, has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: ${resetPasswordLink}`
        );

        // Enviar el correo utilizando la API de Gmail
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage,
            },
        });

        console.log("Correo electrónico de recuperación enviado exitosamente.");

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Solicitud de recuperación de contraseña procesada exitosamente." }),
        };
    } catch (error) {
        console.error("Error al procesar la solicitud de recuperación de contraseña:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error al procesar la solicitud de recuperación de contraseña." }),
        };
    } finally {
        await client.close();
    }
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
