const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const connectDB = require("./mongodb");
const User = require("./src/Componentes/User.js");
const RecoveryToken = require("./src/Componentes/RecoveryToken.js");
const loggedInUsers = [];
const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS
const corsOptions = {
  origin: "*", // Cambia esto con la URL de tu aplicación React
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

connectDB();
// Ruta de registro
app.post("/register", async (req, res) => {
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

    await sendConfirmationEmail(email);

    return res.json({ message: "Usuario registrado exitosamente" });
  } catch (err) {
    return res
      .status(500)
      .json({
        error: "Ha ocurrido algún error. Por favor, vuelve a intentarlo.",
      });
  }
});

// Ruta de inicio de sesión

// Ruta de inicio de sesión
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Todos los campos son obligatorios." });
  }

  try {
    const user = await User.findOne({
      $or: [{ name: username }, { email: username }],
    });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const token = jwt.sign(
          { username, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        console.log("Token generado:", token);

        const existingUserIndex = loggedInUsers.findIndex(
          (u) => u.email === user.email
        );

        if (existingUserIndex !== -1) {
          loggedInUsers[existingUserIndex].username = username;
        } else {
          loggedInUsers.push({
            username,
            email: user.email,
            token,
            name: user.name,
          });
        }

        return res.json({ token });
      } else {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }
    } else {
      return res.status(401).json({ error: "Usuario o correo incorrectas" });
    }
  } catch (err) {
    console.error("Error en el servidor:", err);
    return res
      .status(500)
      .json({
        error:
          "Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.",
      });
  }
});

// Ruta para obtener usuarios conectados
app.get("/logged-in-users", async (req, res) => {
  try {
    const connectedUsers = loggedInUsers.map((user) => user.email);

    const users = await User.find(
      { email: { $in: connectedUsers } },
      "email name"
    );

    const formattedUsers = users.map((user) => ({
      email: user.email,
      name: user.name,
      connected: true,
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Error al obtener usuarios conectados:", error);
    res.status(500).json({ error: "Error al obtener usuarios conectados." });
  }
});

// Ruta para cerrar sesión
app.post("/logout", (req, res) => {
  const { email } = req.body;

  console.log(
    "Solicitud de cierre de sesión recibida. Correo electrónico:",
    email
  );

  // Busca al usuario en la lista de usuarios conectados
  const userIndex = loggedInUsers.findIndex((user) => user.email === email);

  if (userIndex !== -1) {
    // Actualiza el estado del usuario a desconectado (punto rojo)
    loggedInUsers[userIndex].connected = false;

    // Imprime información en la consola para depurar
    console.log("Usuario encontrado y marcado como desconectado");
    console.log(
      "Lista de usuarios actualizada después de cerrar sesión:",
      loggedInUsers
    );

    // Envía la lista actualizada de usuarios después de cerrar sesión
    res.json({ message: "Sesión cerrada exitosamente", users: loggedInUsers });
  } else {
    // Imprime información en la consola para depurar
    console.log("Usuario no encontrado en la lista de usuarios conectados");

    res.json({
      message: "Usuario no encontrado en la lista de usuarios conectados",
    });
  }
});

//ruta para restablecer contraceña
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ error: "El campo de correo electrónico es obligatorio." });
  }

  try {
    const user = await getUserByUsernameOrEmail(email);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Generar un token de recuperación
    const recoveryToken = generateRecoveryToken();

    // Almacenar el token en la base de datos
    await storeRecoveryToken(email, recoveryToken);

    // Enviar un correo electrónico con el enlace de recuperación
    await sendRecoveryEmail(email, recoveryToken);

    return res.json({
      message:
        "Se ha enviado un correo electrónico con las instrucciones para restablecer la contraseña.",
    });
  } catch (err) {
    console.error("Error en el servidor:", err);
    return res
      .status(500)
      .json({
        error:
          "Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.",
      });
  }
});
// Ruta para verificar si ya hay una solicitud de recuperación en progreso para el correo electrónico
app.post("/check-existing-request", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ error: "El campo de correo electrónico es obligatorio." });
  }

  try {
    const existingRequest = await checkExistingRequest(email);

    return res.json({ exists: existingRequest });
  } catch (err) {
    console.error("Error en el servidor:", err);
    return res
      .status(500)
      .json({
        error:
          "Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.",
      });
  }
});

async function checkExistingRequest(email) {
  try {
    // Utiliza el modelo User para buscar en la colección recovery_tokens
    const existingRequest = await RecoveryToken.findOne({ email });

    return !!existingRequest; // Devuelve true si hay una solicitud existente, de lo contrario, false
  } catch (error) {
    console.error("Error al verificar la solicitud existente:", error);
    throw new Error("Error al verificar la solicitud existente.");
  }
}

// Modificación en app.post('/reset-password', ...)
app
  .route("/reset-password/:token")
  .get(async (req, res) => {
    const { token } = req.params;
    console.log("Valor de token (desde la ruta):", token);
    try {
      // Obtener información del usuario asociada al token
      const user = await getUserByToken(token);

      if (!user) {
        return res
          .status(401)
          .json({ error: "Token de recuperación inválido." });
      }

      return res.json({ email: user.email });
    } catch (err) {
      console.error("Error en el servidor:", err);
      return res
        .status(500)
        .json({
          error:
            "Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.",
        });
    }
  })
  .put(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios." });
    }

    try {
      // Obtener información del usuario asociada al token
      const user = await getUserByToken(token);

      if (!user) {
        return res
          .status(401)
          .json({ error: "Token de recuperación inválido." });
      }
      const recoveryToken = await getRecoveryToken(user.email, token);
      console.log("RecoveryToken:", recoveryToken);

      if (!recoveryToken || recoveryToken.expiration_time < Date.now()) {
        return res
          .status(401)
          .json({ error: "Token de recuperación inválido o expirado." });
      }

      if (!recoveryToken || recoveryToken.expiration_time < Date.now()) {
        return res
          .status(401)
          .json({ error: "Token de recuperación inválido o expirado." });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar la contraseña en la base de datos
      await updatePassword(user.email, hashedPassword);

      // Eliminar el token de recuperación de la base de datos
      await deleteRecoveryToken(user.email);

      return res.json({ message: "Contraseña restablecida exitosamente." });
    } catch (err) {
      console.error("Error en el servidor:", err);
      return res
        .status(500)
        .json({
          error:
            "Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.",
        });
    }
  });

function generateRecoveryToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const expirationTime = Date.now() + 3600000; // 1 hora en milisegundos

  console.log("Token generado:", token);

  return { token, expirationTime };
}
async function getUserByToken(token) {
  try {
    // Utiliza el modelo RecoveryToken para buscar en la colección recovery_tokens
    const userToken = await RecoveryToken.findOne({ token });

    if (userToken) {
      return userToken.toObject(); // Devuelve el documento encontrado convertido a objeto
    } else {
      console.log("Token de recuperación no encontrado.");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener usuario por token:", error);
    throw new Error("Error al obtener usuario por token.");
  }
}

async function storeRecoveryToken(email, recoveryToken) {
  try {
    // Utiliza el modelo RecoveryToken para crear un nuevo documento
    await RecoveryToken.create({
      email: email,
      token: recoveryToken.token,
      expiration_time: recoveryToken.expirationTime,
    });

    console.log("Token almacenado en la base de datos:", recoveryToken.token);
  } catch (error) {
    if (error.code === 11000) {
      // Código 11000 indica un error de duplicado (clave única)
      throw new Error(
        "Ya hay una solicitud de recuperación en progreso para este correo electrónico."
      );
    } else {
      console.error("Error al almacenar el token en la base de datos:", error);
      throw new Error("Error al almacenar el token en la base de datos.");
    }
  }
}
//agregar amigo ruta y funcion
const authenticate = async (req, res, next) => {
  console.log("Middleware authenticate ejecutándose");
  
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    console.log("Token recibido en el servidor:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
      throw new Error('Token no válido');
    }

    req.token = token;
    req.user = user;
    console.log("req.user:", req.user);

    next();
  } catch (error) {
    console.error("Error en la autenticación:", error);
    res.status(401).send({ error: 'Error de autenticación' });
  }
};






// Ruta para agregar amigos
app.post("/agregar-amigo", authenticate, async (req, res) => {
  console.log(req.user); // Agregar esta línea
  const { friendUsername } = req.body;

  try {
    // Encuentra al usuario que desea agregar como amigo
    const friend = await User.findOne({ name: friendUsername });

    if (!friend) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Verificar si el amigo ya está en la lista

    console.log("req.user:", req.user);
    console.log("req.user.friends:", req.user.friends);

    const isAlreadyFriend =
      req.user && req.user.friends
        ? req.user.friends.includes(friend._id)
        : false;

    if (isAlreadyFriend) {
      return res
        .status(200)
        .json({ error: "Este usuario ya está en tu lista de amigos." });
    }

    // Agregar el amigo a la lista de amigos del usuario actual
    console.log("req.user antes de agregar amigo:", req.user);
    req.user.friends.push(friend._id);
    await req.user.save();

    // Agregar al usuario actual a la lista de amigos del amigo
    friend.friends.push(req.user._id);
    await friend.save();

    return res.json({
      message: "Amigo agregado exitosamente",
      friends: req.user.friends,
    });
  } catch (error) {
    console.error("Error al agregar amigo:", error);
    res.status(500).json({ error: "Error al agregar amigo." });
  }
});

async function getRecoveryToken(email, providedToken) {
  try {
    console.log("Entrando a getRecoveryToken");
    console.log("Email:", email);
    console.log("Token proporcionado:", providedToken);

    // Utiliza el modelo RecoveryToken para buscar el token en la base de datos
    const row = await RecoveryToken.findOne({ email, token: providedToken });

    console.log("Valor de token (desde la ruta):", providedToken);

    if (row) {
      console.log("Token almacenado en la base de datos:", row.token);

      const validToken = providedToken === row.token;

      console.log("Resultado de la comparación:", validToken);

      if (validToken) {
        return row;
      } else {
        console.error("Error: El token no coincide.");
        throw new Error("Invalid token");
      }
    } else {
      console.log("Token no encontrado en la base de datos.");
      return null;
    }
  } catch (error) {
    console.error("Error en la función getRecoveryToken:", error);
    throw error;
  }
}

// Función para obtener información del usuario a partir del token

async function updatePassword(email, newPassword) {
  try {
    // Utiliza el modelo User para actualizar la contraseña en la base de datos
    await User.updateOne({ email }, { password: newPassword });

    console.log("Contraseña actualizada exitosamente.");
  } catch (error) {
    console.error("Error en la función updatePassword:", error);
    throw error;
  }
}
async function deleteRecoveryToken(email) {
  try {
    // Utiliza el modelo RecoveryToken para eliminar el token de recuperación de la base de datos
    await RecoveryToken.deleteOne({ email });

    console.log("Token de recuperación eliminado exitosamente.");
  } catch (error) {
    console.error("Error en la función deleteRecoveryToken:", error);
    throw error;
  }
}

async function sendRecoveryEmail(email, recoveryToken) {
  const resetPasswordLink = `${process.env.BASE_URL}/reset-password/${recoveryToken.token}`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const msg = {
    to: email,
    from: process.env.GMAIL_USERNAME,
    subject: "Recuperación de Contraseña",
    text: `Hola, has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: ${resetPasswordLink}`,
    html: `<p>Hola, has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: <a href="${resetPasswordLink}">Restablecer Contraseña</a></p>`,
  };

  return transporter.sendMail(msg);
}

//funcion para poder obtener usuario por nombre
async function getUserByUsernameOrEmail(identifier) {
  try {
    // Utiliza el modelo User para buscar al usuario en la base de datos
    const user = await User.findOne({
      $or: [{ name: identifier }, { email: identifier }],
    });

    return user;
  } catch (error) {
    console.error("Error en la función getUserByUsernameOrEmail:", error);
    throw error;
  }
}
async function sendConfirmationEmail(email) {
  const msg = {
    to: email,
    from: process.env.GMAIL_USERNAME,
    subject: "Registro exitoso",
    text: "Gracias por registrarte en nuestra aplicación.",
    html: "<p>Gracias por registrarte en nuestra aplicación.</p>",
  };

  const info = await transporter.sendMail(msg);
  console.log("Correo electrónico enviado. Respuesta del servidor:", info);
}

// Función para insertar un nuevo usuario en la base de datos

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
