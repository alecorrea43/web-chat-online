// deliverUnreadMessages.js
const { MongoClient } = require('mongodb');

// Configuración de la conexión a MongoDB
const uri = process.env.MONGODB_URI; // Asegúrate de tener esta variable de entorno configurada en Netlify
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
 context.callbackWaitsForEmptyEventLoop = false;

 try {
    // Conectar a la base de datos
    await client.connect();
    const db = client.db('test'); // Reemplaza 'nombre_de_tu_base_de_datos' con el nombre real de tu base de datos
    const messagesCollection = db.collection('messages'); // Asegúrate de que 'messages' es el nombre correcto de tu colección

    // Extraer el userEmail de los parámetros de la URL
    const { userEmail } = event.queryStringParameters;

    // Buscar mensajes no entregidos en la base de datos usando el userEmail
    const messages = await messagesCollection.find({ recipient: userEmail, delivered: false }).toArray();

    // Actualizar el estado de los mensajes no entregidos a 'true'
    await messagesCollection.updateMany(
      { recipient: userEmail, delivered: false },
      { $set: { delivered: true } }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ messages }),
    };
 } catch (error) {
    console.error("Error al entregar mensajes no leídos:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
 } finally {
    // Cerrar la conexión a la base de datos
    await client.close();
 }
};