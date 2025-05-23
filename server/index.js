const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// --- Matchmaking and game relay logic ---
let waitingPlayer = null;
let roomCounter = 1;

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join-game", () => {
    if (waitingPlayer && waitingPlayer.connected) {
      // Pair with waiting player
      const room = "room" + roomCounter++;
      socket.join(room);
      waitingPlayer.join(room);

      // Notify both players of their roles
      socket.emit("game-start", { role: "player2", room });
      waitingPlayer.emit("game-start", { role: "player1", room });

      waitingPlayer = null;
    } else {
      console.log("Waiting for another player...");
      // Wait for another player
      waitingPlayer = socket;
      socket.emit("waiting");
    }
  });

  // Relay sync-state to the other player in the room
  socket.on("sync-state", (data) => {
    // Find the room this socket is in (other than its own id)
    const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    if (rooms.length > 0) {
      socket.to(rooms[0]).emit("sync-state", data);
    }
  });

  // Relay move to the other player in the room
  socket.on("move", (data) => {
    const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    if (rooms.length > 0) {
      socket.to(rooms[0]).emit("move", data);
    }
  });

  socket.on("disconnect", () => {
    if (waitingPlayer === socket) waitingPlayer = null;
  });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
