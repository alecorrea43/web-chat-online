const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("/src/Componentes/User"); // Importa el modelo de usuario si lo tienes

exports.handler = async (event, context) => {
  const { name, email, password } = JSON.parse(event.body);

  if (!name || !email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Todos los campos son obligatorios." }),
    };
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingUser = await User.findOne({ $or: [{ name }, { email }] });

    if (existingUser) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          error:
            existingUser.name === name
              ? "El nombre de usuario ya está en uso, elige otro."
              : "El correo ya ha sido registrado, crea otro o inicia sesión.",
        }),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();


    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuario registrado exitosamente" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Ha ocurrido algún error. Por favor, vuelve a intentarlo.",
      }),
    };
  } finally {
    await mongoose.disconnect();
  }
};