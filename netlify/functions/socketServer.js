const Message = require('../../src/Pages/Message');

const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server);

// Estructura para almacenar usuarios conectados
let loggedInUsers = [];
// Mapa para asociar emails con socketIds
let emailToSocketIdMap = {};

function generateConversationId(user1, user2) {
  // Ordena los correos electrónicos de manera alfabética para asegurar consistencia
  const sortedEmails = [user1, user2].sort();
  // Concatena los correos electrónicos para formar un identificador único
  const conversationId = sortedEmails.join('_');
  return conversationId;
}

io.on("connection", (socket) => {
  console.log("New client connected");
  console.log('Socket connected with ID:', socket.id);

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

        // Asignar el conversationId utilizando la función generateConversationId
        const conversationId = generateConversationId(senderEmail, recipientUser.email);
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
          createdAt: new Date().toISOString(),
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

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: "Socket.io server running!",
  };
};