const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

exports.handler = async (event, context) => {
    const uri = process.env.MONGODB_URI; // Asegúrate de tener esta variable de entorno configurada
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const collection = client.db("test").collection("users");
        const userData = JSON.parse(event.body);

        // Cifrar la contraseña antes de guardarla
        const saltRounds = 10; // Número de rondas para el cifrado
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        userData.password = hashedPassword; // Reemplazar la contraseña en texto plano con la cifrada

        const result = await collection.insertOne(userData);
        console.log(`Usuario insertado con el _id: ${result.insertedId}`);
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