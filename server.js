const Message = require('./src/Componentes/Message');

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
let loggedInUsers = [];
const app = express();
const PORT = process.env.PORT || 3001;
const http = require("http");
const socketIo = require("socket.io");
let emailToSocketIdMap = {};

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
     origin: 'http://localhost:3000', 
     methods: ['GET', 'POST'],
     allowedHeaders: ['my-custom-header'],
     credentials: true
  },
  debug: true
 });
io.on("connection", (socket) => {
  console.log("New client connected");
  console.log('Socket conectado con ID:', socket.id);
  // Almacenar temporalmente el socketId y el email del usuario
  let tempUser = {
     socketId: socket.id,
     email: null,
     name: null,
  };
 
  // Escuchar el evento 'userConnected'
  socket.on("userConnected", (userData) => {
    console.log("Evento userConnected recibido:", userData);
    // Actualizar el nombre y el email del usuario temporal
    tempUser.name = userData.name;
    tempUser.email = userData.email;
    tempUser.socketId = socket.id;
   
    // Solo emitir el evento 'userConnected' si el nombre del usuario está disponible
    if (tempUser.name) {
      emailToSocketIdMap[tempUser.email] = tempUser.socketId;
      console.log(`Usuario conectado: ${tempUser.name} (${tempUser.email}), socketId: ${tempUser.socketId}`);
       // Verificar si el usuario ya está en la lista loggedInUsers por email
       const existingUserIndex = loggedInUsers.findIndex(u => u.email === tempUser.email);
       if (existingUserIndex === -1) {
         // Si el usuario no existe, añadir al usuario a la lista global de loggedInUsers
         // Asegúrate de establecer el estado 'connected' a true
         loggedInUsers.push({ ...tempUser, connected: true });
       } else {
         // Si el usuario ya existe, actualizar el usuario existente en lugar de agregar uno nuevo
         // Asegúrate de establecer el estado 'connected' a true
         loggedInUsers[existingUserIndex] = {
           ...loggedInUsers[existingUserIndex],
           socketId: tempUser.socketId, // Actualizar el socketId
           name: tempUser.name, // Actualizar el nombre si es necesario
           connected: true, // Establecer el estado 'connected' a true
         };
       }
       // Emitir la lista actualizada de usuarios conectados a todos los clientes
       io.emit("currentUsers", loggedInUsers);
    }
   });
  
  // Manejar el evento de desconexión
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    // Encontrar el índice del usuario desconectado por socket.id
    const userIndex = loggedInUsers.findIndex(u => u.socketId === socket.id);
    if (userIndex !== -1) {
       // Marcar el usuario como desconectado
       loggedInUsers[userIndex].connected = false;

       delete emailToSocketIdMap[loggedInUsers[userIndex].email];

       console.log(`Usuario desconectado: ${loggedInUsers[userIndex].email}, eliminado del mapa`);
       // Notificar a todos los usuarios conectados que un usuario se ha desconectado
       io.emit("userDisconnected", loggedInUsers[userIndex]);
       // Emitir la lista actualizada de usuarios conectados a todos los clientes
       io.emit("currentUsers", loggedInUsers);
    } else {
       console.log("No user found to disconnect");
    }
   });
   socket.on('sendMessage', async ({ message, recipientSocketId, senderName, senderEmail }) => {
    console.log("Evento 'sendMessage' recibido en el servidor:", message, recipientSocketId);
    console.log('Mensaje recibido:', message);
    console.log('Nombre del remitente:', senderName);
    console.log('Email del remitente:', senderEmail); // Depuración: Verifica el email del remitente
  
    try {
        // Buscar al usuario destinatario en la lista de usuarios conectados
        const recipientUser = loggedInUsers.find(user => user.socketId === recipientSocketId);
    
        if (recipientUser) {
            console.log(`Enviando el mensaje ${message} a: ${recipientUser.email} con socketId: ${recipientSocketId}`);
        
            // Asignar el conversationId, que puede ser el ID del chat o cualquier identificador único de la conversación
            const conversationId = generateConversationId(senderEmail, recipientUser.email); // Implementa tu lógica para generar el conversationId
            console.log("ConversationId asignado al mensaje:", conversationId);
            // Guardar el mensaje en la base de datos con el conversationId asignado
            const newMessage = new Message({
                sender: senderName,
                recipient: recipientUser.email,
                text: message,
                conversationId: conversationId, // Asigna el conversationId aquí
            });
            await newMessage.save();
        
            console.log("Mensaje guardado en la base de datos:", newMessage);
        
            // Emitir el mensaje al destinatario
            io.to(recipientSocketId).emit('message', {
                sender: senderName,
                recipientEmail: recipientUser.email,
                text: message,
                senderName: senderName,
                conversationId: conversationId,
            });
        
            console.log("Mensaje enviado al destinatario");
        
            // Emitir confirmación al remitente
            socket.emit('messageSent', { message: 'Mensaje enviado', sender: 'Server' });
        } else {
            console.log(`El destinatario con socketId: ${recipientSocketId} no está conectado.`);
            socket.emit('messageError', { message: 'El destinatario no está conectado', sender: 'Server' });
        }
    } catch (error) {
        console.error("Error al enviar el mensaje:", error);
        socket.emit('messageError', { message: 'Error al enviar el mensaje', sender: 'Server' });
    }
});
});


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

function generateConversationId(user1, user2) {
  // Ordena los correos electrónicos de manera alfabética para asegurar consistencia
  const sortedEmails = [user1, user2].sort();
  // Concatena los correos electrónicos para formar un identificador único
  const conversationId = sortedEmails.join('_');
  return conversationId;
}
// Lógica para guardar un nuevo mensaje
app.get("/messages/:conversationId", async (req, res) => {
  const { conversationId } = req.params;

  try {
    // Buscar mensajes en la base de datos usando el conversationId
    const messages = await Message.find({ conversationId });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error al cargar los mensajes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
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
          { username: user.name, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );
        

        const existingUserIndex = loggedInUsers.findIndex(
          (u) => u.email === user.email
        );

        if (existingUserIndex !== -1) {
          loggedInUsers[existingUserIndex].username = user.name;
        } else {
          loggedInUsers.push({
            username: user.name,
            email: user.email,
            token,
            name: user.name,
          });
        }

        return res.json({ 
          token, 
          username: user.name || username,
          email: user.email,
          name: user.name 
        });
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
app.get("/logged-in-users", (req, res) => {
  try {
    
    const formattedUsers = loggedInUsers.map((user) => ({
      ...user,
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
  // Extraer el token del encabezado Authorization
  const token = req.header("Authorization").replace("Bearer ", "");

  // Verificar y decodificar el token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("Error al verificar el token:", err);
    return res.status(401).json({ error: "Token inválido o expirado." });
  }

  // Extraer el correo electrónico del token decodificado
  const userEmail = decoded.email;

  // Buscar al usuario en la lista loggedInUsers
  const userIndex = loggedInUsers.findIndex((user) => user.email === userEmail);

  if (userIndex !== -1) {
    // Actualizar el estado de conexión del usuario
    loggedInUsers[userIndex].connected = false;

    // Emitir el evento 'userDisconnected' a los clientes conectados
    io.emit('userDisconnected', loggedInUsers[userIndex]);

    res.json({ message: "Sesión cerrada exitosamente" });
  } else {
    res.json({ message: "Usuario no encontrado en la lista de usuarios conectados" });
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

    const user = await User.findOne({ email: decoded.email });


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
      ? req.user.friends.map(friendId => friendId.toString()).includes(friend._id.toString())
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

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
