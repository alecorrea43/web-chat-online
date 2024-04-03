const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
 if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
 }

 const { nombre, email, password } = JSON.parse(event.body);

 // Acceder a la variable de entorno MONGODB_URI
 const uri = process.env.MONGODB_URI;

 // Conectar a MongoDB
 const client = new MongoClient(uri);
 try {
    await client.connect();
    const db = client.db('test'); // Asegúrate de reemplazar 'nombre_de_tu_base_de_datos' con el nombre real de tu base de datos
    const collection = db.collection('users');

    // Aquí puedes insertar el usuario en la base de datos
    const result = await collection.insertOne({ nombre, email, password });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuario registrado exitosamente", userId: result.insertedId }),
    };
 } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al registrar el usuario" }),
    };
 } finally {
    await client.close();
 }
};