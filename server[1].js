const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.get("/", (req, res) => {
  res.send("Serenity VR Signaling Server — Running");
});

// Networked-Aframe signaling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (data) => {
    socket.join(data.room);
    socket.to(data.room).emit("userJoined", { id: socket.id });
    console.log(`${socket.id} joined room: ${data.room}`);
  });

  socket.on("send", (data) => {
    socket.to(data.room).emit("receive", data);
  });

  socket.on("broadcast", (data) => {
    socket.broadcast.to(data.room).emit("receive", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    io.emit("userLeft", { id: socket.id });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serenity signaling server running on port ${PORT}`);
});
