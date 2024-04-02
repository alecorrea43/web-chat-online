const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
 // Configuración de MongoDB
 const uri = process.env.MONGODB_URI; // Asegúrate de tener esta variable de entorno configurada en Netlify
 const client = new MongoClient(uri);

 try {
    await client.connect();
    const collection = client.db("yourDatabaseName").collection("yourCollectionName");

    // Aquí puedes realizar operaciones en MongoDB, como insertar datos
    const result = await collection.insertOne({ name: "John Doe", email: "john@example.com" });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Operación exitosa", result }),
    };
 } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al conectar con MongoDB" }),
    };
 } finally {
    await client.close();
 }
};