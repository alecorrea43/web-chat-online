const { Server } = require("socket.io");
const http = require("http");
const { MongoClient } = require('mongodb'); // Importa MongoClient de mongodb

const server = http.createServer();
const io = new Server(server);

let loggedInUsers = [];
let emailToSocketIdMap = {};

function generateConversationId(user1, user2) {
  const sortedEmails = [user1, user2].sort();
  return sortedEmails.join('_');
}

// Configura tu URI de conexión a MongoDB
const uri = process.env.MONGODB_URI;

io.on("connection", (socket) => {
  console.log("New client connected");
  console.log('Socket connected with ID:', socket.id);

  let tempUser = {
    socketId: socket.id,
    email: null,
    name: null,
  };

  socket.on("userConnected", (userData) => {
    console.log("Evento userConnected recibido:", userData);
    tempUser.name = userData.name;
    tempUser.email = userData.email;
    tempUser.socketId = socket.id;

    if (tempUser.name) {
      emailToSocketIdMap[tempUser.email] = tempUser.socketId;
      console.log(`Usuario conectado: ${tempUser.name} (${tempUser.email}), socketId: ${tempUser.socketId}`);
      const existingUserIndex = loggedInUsers.findIndex(u => u.email === tempUser.email);
      if (existingUserIndex === -1) {
        loggedInUsers.push({ ...tempUser, connected: true });
      } else {
        loggedInUsers[existingUserIndex] = {
          ...loggedInUsers[existingUserIndex],
          socketId: tempUser.socketId,
          name: tempUser.name,
          connected: true,
        };
      }
      io.emit("currentUsers", loggedInUsers);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    const userIndex = loggedInUsers.findIndex(u => u.socketId === socket.id);
    if (userIndex !== -1) {
      loggedInUsers[userIndex].connected = false;
      delete emailToSocketIdMap[loggedInUsers[userIndex].email];
      io.emit("userDisconnected", loggedInUsers[userIndex]);
      io.emit("currentUsers", loggedInUsers);
    } else {
      console.log("No user found to disconnect");
    }
  });

  socket.on('sendMessage', async ({ message, recipientSocketId, senderName, senderEmail }) => {
    console.log("Evento 'sendMessage' recibido en el servidor:", message, recipientSocketId);
    console.log('Mensaje recibido:', message);
    console.log('Nombre del remitente:', senderName);
    console.log('Email del remitente:', senderEmail);

    try {
      const recipientUser = loggedInUsers.find(user => user.socketId === recipientSocketId);
      if (recipientUser) {
        console.log(`Enviando el mensaje ${message} a: ${recipientUser.email} con socketId: ${recipientSocketId}`);
        const conversationId = generateConversationId(senderEmail, recipientUser.email);
        
        // Conecta a MongoDB y guarda el mensaje
        const client = new MongoClient(uri);
        await client.connect();
        const messagesCollection = client.db("test").collection("messages");
        const newMessage = {
          sender: senderName,
          recipient: recipientUser.email,
          text: message,
          conversationId: conversationId,
          createdAt: new Date().toISOString(),
        };
        await messagesCollection.insertOne(newMessage);
        await client.close();

        io.to(recipientSocketId).emit('message', {
          sender: senderName,
          recipientEmail: recipientUser.email,
          text: message,
          senderName: senderName,
          conversationId: conversationId,
          createdAt: new Date().toISOString(),
        });

        console.log("Mensaje enviado al destinatario");
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