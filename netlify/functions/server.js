const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const connectDB = require("../../mongodb")
const bcrypt = require("bcrypt"); // Asegúrate de requerir bcrypt si lo estás utilizando
const User = require("../../src/Pages/User"); // Asegúrate de tener un modelo de usuario
// Asegúrate de tener una función para enviar correos de confirmación

const app = express();
app.use(cors());
app.use(express.json()); // Asegúrate de usar un middleware para parsear el cuerpo de las solicitudes JSON
connectDB();

const port = process.env.PORT || 5000;
const router = express.Router();

router.post("/register", async (req, res) => {
 const { name, email, password } = req.body;

 if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Todos los campos son obligatorios." });
 }

 try {
    const existingUser = await User.findOne({ $or: [{ name }, { email }] });

    if (existingUser) {
      return res
        .status(200)
        .json({
          error:
            existingUser.name === name
              ? "El nombre de usuario ya está en uso, elige otro."
              : "El correo ya ha sido registrado, crea otro o inicia sesión.",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();


    return res.json({ message: "Usuario registrado exitosamente" });
 } catch (err) {
    return res
      .status(500)
      .json({
        error: "Ha ocurrido algún error. Por favor, vuelve a intentarlo.",
      });
 }
});

app.use("/.netlify/functions/server", router);

// Exporta la función handler usando CommonJS
module.exports.handler = serverless(app);

