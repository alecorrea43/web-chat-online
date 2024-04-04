const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
app.use(bodyParser.json());

const client = new MongoClient(process.env.MONGODB_URI);

app.post('/register', async (req, res) => {
 try {
    await client.connect();
    const collection = client.db("test").collection("users");
    const user = req.body;
    const result = await collection.insertOne(user);
    res.status(200).json({ message: "User registered successfully", userId: result.insertedId });
 } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering user" });
 } finally {
    await client.close();
 }
});

exports.handler = async (event, context) => {
 return app(event, context);
};