const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST" && event.httpMethod !== "PUT") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { token, newPassword } = JSON.parse(event.body);

    try {
        await client.connect();
        const recoveryTokensCollection = client.db("test").collection("recoveryTokens");
        const userToken = await recoveryTokensCollection.findOne({ token });

        if (!userToken) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Token de recuperación inválido." })
            };
        }

        const usersCollection = client.db("test").collection("users");

        if (event.httpMethod === "POST") {
            // Obtener información del usuario asociada al token
            const user = await usersCollection.findOne({ email: userToken.email });
            return {
                statusCode: 200,
                body: JSON.stringify({ email: user.email })
            };
        } else if (event.httpMethod === "PUT") {
            // Actualizar la contraseña del usuario
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await usersCollection.updateOne({ email: userToken.email }, { $set: { password: hashedPassword } });

            // Eliminar el token de recuperación
            await recoveryTokensCollection.deleteOne({ token });

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Contraseña restablecida exitosamente y token eliminado." })
            };
        }
    } catch (error) {
        console.error("Error al procesar la solicitud:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo." })
        };
    } finally {
        await client.close();
    }
};
