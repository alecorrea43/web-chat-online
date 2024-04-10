const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("chat message", (msg) => {
    console.log("Message received: " + msg);
    io.emit("chat message", msg);
  });
});

server.listen(3000, () => {
  console.log("Socket.io server running on port 3000");
});