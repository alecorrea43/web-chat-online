const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
 if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
 }

 const client = new MongoClient(process.env.MONGODB_URI);

 try {
    await client.connect();
    const collection = client.db("test").collection("users");
    const user = JSON.parse(event.body);
    const result = await collection.insertOne(user);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User registered successfully", userId: result.insertedId }),
    };
 } catch (error) {
    return { statusCode: 500, body: error.toString() };
 } finally {
    await client.close();
 }
};