const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

exports.handler = async (event, context) => {
    if (event.httpMethod !== "PUT") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { token, newPassword } = JSON.parse(event.body);

    if (!token || !newPassword) {
     return { statusCode: 400, body: JSON.stringify({ error: "Token and new password are required" }) };
    }

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const usersCollection = client.db("test").collection("users");
        const recoveryTokensCollection = client.db("test").collection("recoveryTokens");

        const tokenData = await recoveryTokensCollection.findOne({ token });

        if (!tokenData) {
            return { statusCode: 404, body: "Token not found" };
        }

        if (tokenData.used) {
            return { statusCode: 400, body: JSON.stringify({ error: "Recovery password token has already been used" }) };
        }


        const currentTime = new Date();
        if (currentTime > tokenData.expirationTime) {
            return { statusCode: 400, body: "Token has expired" };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await usersCollection.updateOne({ email: tokenData.email }, { $set: { password: hashedPassword } });


        await recoveryTokensCollection.updateOne({ token }, { $set: { used: true } });
        await recoveryTokensCollection.deleteOne({ token });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Password reset successfully" })
        };
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        return { statusCode: 500, body: "Internal server error" };
    } finally {
        await client.close();
    }
};