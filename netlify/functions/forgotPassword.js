const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const { google } = require('googleapis');
require('dotenv').config();

const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

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
        const db = client.db("test");
        const usersCollection = db.collection("users");
        const recoveryTokensCollection = db.collection("recoveryTokens");

        // Verificar si el email existe en la base de datos de usuarios
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "El correo electrónico no está registrado." }),
            };
        }

        // Generar un token de recuperación
        const token = crypto.randomBytes(32).toString("hex");
        const expirationTime = new Date(Date.now() + 3600000); // 1 hora en el futuro

        // Almacenar el token de recuperación en la base de datos
        await recoveryTokensCollection.insertOne({
            email,
            token,
            expirationTime,
            used: false, // Indicador para saber si el token ya fue utilizado
        });

        // Enviar el correo electrónico con el enlace de recuperación
        const resetPasswordLink = `https://web-chatonline.netlify.app/reset-password/${token}`;
    

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        const mailOptions = {
            from: `Tu Nombre <${process.env.GMAIL_USERNAME}>`,
            to: email,
            subject: "Recuperación de Contraseña",
            text: `Hola, has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: ${resetPasswordLink}`,
            html: `<p>Hola, has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: <a href="${resetPasswordLink}">Restablecer Contraseña</a></p>`,
        };

        const encodedMessage = Buffer.from(
            `Content-Type: text/html; charset=utf-8\r\n` +
            `MIME-Version: 1.0\r\n` +
            `Content-Transfer-Encoding: 7bit\r\n` +
            `to: ${email}\r\n` +
            `subject: ${mailOptions.subject}\r\n\r\n` +
            `${mailOptions.html}`
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
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
