const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { token } = event.queryStringParameters;

    if (!token) {
        return { statusCode: 400, body: "Token is required" };
    }

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const recoveryTokensCollection = client.db("test").collection("recoveryTokens");

        const tokenData = await recoveryTokensCollection.findOne({ token });

        if (!tokenData) {
            return { statusCode: 404, body: "Token not found" };
        }

        const currentTime = new Date();
        if (currentTime > tokenData.expirationTime) {
            return { statusCode: 400, body: "Token a expirado" };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ email: tokenData.email })
        };
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        return { statusCode: 500, body: "Internal server error" };
    } finally {
        await client.close();
    }
};