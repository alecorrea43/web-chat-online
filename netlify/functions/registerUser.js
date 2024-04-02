// netlify/functions/registerUser.js

const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
 if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
 }

 const data = JSON.parse(event.body);
 const { name, email, password } = data;

 // Configuración de MongoDB
 const uri = process.env.MONGODB_URL; // Asegúrate de tener esta variable de entorno configurada en Netlify
 const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

 try {
    await client.connect();
    const collection = client.db("test").collection("users");

    // Verifica si el usuario ya existe
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "El correo electrónico ya está en uso." }),
      };
    }

    // Aquí puedes agregar más validaciones, como verificar la longitud de la contraseña

    // Inserta el nuevo usuario en la base de datos
    await collection.insertOne({ name, email, password });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuario registrado con éxito." }),
    };
 } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al registrar el usuario." }),
    };
 } finally {
    await client.close();
 }
};
