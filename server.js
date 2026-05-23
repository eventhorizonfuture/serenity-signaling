const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const easyrtc = require("open-easyrtc");

const app = express();
const httpServer = http.createServer(app);

const io = socketio(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.get("/", (req, res) => {
  res.send("NAF + EasyRTC signaling server is running.");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

easyrtc.setOption("logLevel", "warning");
easyrtc.setOption("demosEnable", false);

easyrtc.listen(app, io, null, (err, rtcRef) => {
  if (err) {
    console.error("EasyRTC error:", err);
    return;
  }
  rtcRef.events.on("easyrtcAuth", (socket, easyrtcid, msg, msgCallback, next) => {
    next(null, socket, easyrtcid, msg, msgCallback);
  });
  console.log("EasyRTC signaling server ready.");
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serenity VR signaling server running on port ${PORT}`);
});
