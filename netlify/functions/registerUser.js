const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { nombre, email, password } = JSON.parse(event.body);

  // Acceder a la variable de entorno MONGODB_URI
  const uri = process.env.MONGODB_URI;

  // Conectar a MongoDB
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db('test');
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