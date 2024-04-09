const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    // Asegúrate de que el evento es una solicitud POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Método no permitido" }),
        };
    }

    // Parsear el cuerpo de la solicitud para obtener el correo electrónico
    const { email } = JSON.parse(event.body);

    if (!email) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "El campo de correo electrónico es obligatorio." }),
        };
    }

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const recoveryTokensCollection = client.db("test").collection("recoveryTokens");

        // Verificar si ya existe una solicitud de recuperación para el correo electrónico
        const existingRequest = await recoveryTokensCollection.findOne({ email });

        return {
            statusCode: 200,
            body: JSON.stringify({ exists: !!existingRequest }),
        };
    } catch (error) {
        console.error("Error al verificar la solicitud existente:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.",
            }),
        };
    } finally {
        await client.close();
    }
};