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

// Simple matchmaking system to pair two players into a "room"
let waitingPlayer = null;
let roomCounter = 1;

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

  // Matchmaking: pair two players into a room
  socket.on("join-game", () => {
    if (waitingPlayer && waitingPlayer.connected) {
      // Pair with waiting player
      const room = "room" + roomCounter++;
      socket.join(room);
      waitingPlayer.join(room);

      // Notify both players of their roles
      socket.emit("game-start", { role: "opponent", room });
      waitingPlayer.emit("game-start", { role: "you", room });

      waitingPlayer = null;
    } else {
      // Wait for another player
      waitingPlayer = socket;
      socket.emit("waiting");
    }
  });

  // Relay game actions to the other player in the room
  socket.on("game-action", ({ room, action, data }) => {
    socket.to(room).emit("game-action", { action, data });
  });

  socket.on("disconnect", () => {
    if (waitingPlayer === socket) waitingPlayer = null;
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
