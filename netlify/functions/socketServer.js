const { Server } = require("socket.io");
const server = new Server();

server.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("chat message", (msg) => {
    console.log("Message received: " + msg);
    server.emit("chat message", msg);
  });
});

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: "Socket.io server running!",
  };
};