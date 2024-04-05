const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    const uri = process.env.MONGODB_URI; // Asegúrate de tener esta variable de entorno configurada
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const collection = client.db("test").collection("users");
        let userData = JSON.parse(event.body);

        // Verificar si el nombre de usuario o el correo electrónico ya existen
        const existingUser = await collection.findOne({
            $or: [
                { name: userData.name },
                { email: userData.email }
            ]
        });

        if (existingUser) {
            // Si el usuario ya existe, devolver un mensaje de error
            return {
                statusCode: 200,
                body: JSON.stringify({
                    error: existingUser.name === userData.name
                        ? "El nombre de usuario ya está en uso, elige otro."
                        : "El correo ya ha sido registrado, crea otro o inicia sesión.",
                }),
            };
        }

        // Cifrar la contraseña antes de guardarla
        const saltRounds = 10; // Número de rondas para el cifrado
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        userData.password = hashedPassword; // Reemplazar la contraseña en texto plano con la cifrada

        // Agregar el campo 'connected' con valor predeterminado de false
        userData.connected = false;

        const result = await collection.insertOne(userData);
        console.log(`Usuario insertado con el _id: ${result.insertedId}`);


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USERNAME, // Utiliza la variable de entorno
                pass: process.env.GMAIL_PASSWORD // Utiliza la variable de entorno
            }
        });

        // Opciones del correo
        const mailOptions = {
            from: process.env.GMAIL_USERNAME,
            to: userData.email,
            subject: 'Bienvenido a nuestra página web',
            text: `Hola ${userData.name}, gracias por registrarte en nuestra página web. ¡Esperamos que disfrutes de nuestros servicios!`,
           
        };

        // Enviar el correo
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
