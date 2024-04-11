const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
// Configuración de la conexión a MongoDB
const uri = process.env.MONGODB_URI; // Asegúrate de tener esta variable de entorno configurada en Netlify
const client = new MongoClient(uri);


exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
   
    try {
       // Extraer el token del encabezado Authorization
       const token = event.headers.authorization.replace("Bearer ", "");
   
       // Verificar y decodificar el token
       let decoded;
       try {
         decoded = jwt.verify(token, process.env.JWT_SECRET);
       } catch (err) {
         console.error("Error al verificar el token:", err);
         return {
           statusCode: 401,
           body: JSON.stringify({ error: "Token inválido o expirado." }),
         };
       }
   
       // Extraer el correo electrónico del token decodificado
       const userEmail = decoded.email;
   
       // Conectar a la base de datos
       await client.connect();
       const db = client.db('test'); // Reemplaza 'nombre_de_tu_base_de_datos' con el nombre real de tu base de datos
       const usersCollection = db.collection('users'); // Asegúrate de que 'users' es el nombre correcto de tu colección
   
       // Buscar al usuario en la colección y actualizar su estado de conexión
       const result = await usersCollection.updateOne(
         { email: userEmail },
         { $set: { connected: false } }
       );
   
       if (result.modifiedCount === 1) {
         return {
           statusCode: 200,
           body: JSON.stringify({ message: "Sesión cerrada exitosamente" }),
         };
       } else {
         return {
           statusCode: 404,
           body: JSON.stringify({ message: "Usuario no encontrado en la lista de usuarios conectados" }),
         };
       }
    } catch (error) {
       console.error("Error al procesar el cierre de sesión:", error);
       return {
         statusCode: 500,
         body: JSON.stringify({ error: "Error interno del servidor" }),
       };
    } finally {
       // Cerrar la conexión a la base de datos
       await client.close();
    }
   };