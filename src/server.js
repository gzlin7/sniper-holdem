const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from src/views
app.use(express.static(path.join(__dirname, "views")));

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Socket.IO signaling for WebRTC
io.on("connection", (socket) => {
  socket.on("signal", (data) => {
    // Relay signaling data to the target peer
    io.to(data.target).emit("signal", {
      sender: socket.id,
      signal: data.signal,
    });
  });

  socket.on("join", () => {
    // Send the list of other clients to the new client
    const clients = Array.from(io.sockets.sockets.keys()).filter(id => id !== socket.id);
    socket.emit("peers", clients);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
