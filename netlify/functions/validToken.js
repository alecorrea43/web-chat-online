const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function validateAndAssociateToken(token) {
    try {
        await client.connect();
        const recoveryTokensCollection = client.db("test").collection("recoveryTokens");
        const userToken = await recoveryTokensCollection.findOne({ token });

        if (!userToken) {
            return { isValid: false, message: "Token de recuperación inválido." };
        }

        // Verificar si el token ha expirado
        const currentTime = new Date();
        if (currentTime > userToken.expiration_time) {
            return { isValid: false, message: "El token de recuperación ha expirado." };
        }

        // El token es válido, devolver la información del usuario
        return { isValid: true, user: userToken };
    } catch (error) {
        console.error("Error al validar y asociar el token:", error);
        return { isValid: false, message: "Ha ocurrido un error al validar y asociar el token." };
    } finally {
        await client.close();
    }
}

exports.handler = async (event, context) => {
    // Extraer el token del cuerpo de la solicitud
    const { token } = JSON.parse(event.body);

    // Validar y asociar el token
    const validationResult = await validateAndAssociateToken(token);
    if (!validationResult.isValid) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: validationResult.message })
        };
    }

    // Si el token es válido, devolver la información del usuario
    return {
        statusCode: 200,
        body: JSON.stringify({ email: validationResult.user.email })
    };
};