const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const connectDB = require("../../mongodb");
const registerRoute = require("./registerRoute"); // Asegúrate de que esta ruta sea correcta

const app = express();
app.use(cors());
app.use(express.json());
connectDB();

app.use("/", registerRoute); // Usa la ruta /register importada



// Exporta la función handler usando CommonJS
module.exports.handler = serverless(app);