const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

async function handlePasswordRecoveryRequest(email) {
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
        await sendRecoveryEmail(email, token);

        console.log("Solicitud de recuperación de contraseña procesada exitosamente.");
    } catch (error) {
        console.error("Error al procesar la solicitud de recuperación de contraseña:", error);
        throw new Error("Error al procesar la solicitud de recuperación de contraseña.");
    } finally {
        await client.close();
    }
}

async function sendRecoveryEmail(email, token) {
    const resetPasswordLink = `${process.env.BASE_URL}/reset-password/${token}`;
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD,
        },
    });

    const msg = {
        to: email,
        from: process.env.GMAIL_USERNAME,
        subject: "Recuperación de Contraseña",
        text: `Hola, has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: ${resetPasswordLink}`,
        html: `<p>Hola, has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: <a href="${resetPasswordLink}">Restablecer Contraseña</a></p>`,
    };

    try {
        await transporter.sendMail(msg);
        console.log("Correo electrónico de recuperación enviado exitosamente.");
    } catch (error) {
        console.error("Error al enviar el correo electrónico de recuperación:", error);
        throw new Error("Error al enviar el correo electrónico de recuperación.");
    }
}
