const { MongoClient } = require('mongodb');
const crypto = require('crypto');

async function createAndStoreRecoveryToken(email) {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const collection = client.db("test").collection("recoveryTokens");

        // Generar un token de recuperación
        const token = crypto.randomBytes(32).toString("hex");
        const expirationTime = new Date(Date.now() + 3600000); // 1 hora en el futuro

        // Buscar el usuario por correo electrónico
        const user = await client.db("test").collection("users").findOne({ email });

        if (user) {
            // Almacenar el token de recuperación en la base de datos
            await collection.insertOne({
                email,
                token,
                expirationTime
            });

            console.log("Token de recuperación almacenado en la base de datos:", token);
            return token;
        } else {
            console.log("Usuario no encontrado");
            return null;
        }
    } catch (error) {
        console.error("Error al crear y almacenar el token de recuperación:", error);
        throw error;
    } finally {
        await client.close();
    }
}
