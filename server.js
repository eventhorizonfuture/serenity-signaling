const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.get("/", (req, res) => {
  res.send("Serenity VR Signaling Server — Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

io.on("connection", function(socket) {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", function(data) {
    var room = data.room;
    socket.join(room);
    socket.room = room;
    var joinedTime = Date.now();
    socket.joinedTime = joinedTime;

    // Ack the joiner
    socket.emit("connectSuccess", { joinedTime: joinedTime });

    // Tell everyone in the room who is here
    var occupants = {};
    var clients = io.sockets.adapter.rooms.get(room) || new Set();
    clients.forEach(function(id) {
      var s = io.sockets.sockets.get(id);
      if (s) occupants[id] = s.joinedTime || joinedTime;
    });
    io.in(room).emit("occupantsChanged", { occupants: occupants });
    console.log(socket.id + " joined room: " + room);
  });

  socket.on("send", function(data) {
    io.to(data.to).emit("send", data);
  });

  socket.on("broadcast", function(data) {
    if (socket.room) socket.to(socket.room).emit("broadcast", data);
  });

  socket.on("disconnect", function() {
    console.log("User disconnected:", socket.id);
    if (!socket.room) return;
    var room = socket.room;
    var occupants = {};
    var clients = io.sockets.adapter.rooms.get(room) || new Set();
    clients.forEach(function(id) {
      var s = io.sockets.sockets.get(id);
      if (s) occupants[id] = s.joinedTime;
    });
    io.in(room).emit("occupantsChanged", { occupants: occupants });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log("Serenity VR signaling server running on port " + PORT);
});
