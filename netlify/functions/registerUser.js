const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
 if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
 }

 const { name, email, password } = JSON.parse(event.body);

 // Conectar a MongoDB
 const uri = process.env.MONGODB_URI;
 const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

 try {
    await client.connect();
    const collection = client.db("yourDatabaseName").collection("users");

    // Verificar si el usuario ya existe
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "El correo electrónico ya está en uso" }),
      };
    }

    // Aquí asumimos que estás almacenando las contraseñas en texto plano, lo cual no es seguro.
    // Deberías considerar el uso de hash y salting para las contraseñas.
    const newUser = { name, email, password };

    // Insertar el nuevo usuario en la base de datos
    await collection.insertOne(newUser);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuario registrado exitosamente" }),
    };
 } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
 } finally {
    await client.close();
 }
};