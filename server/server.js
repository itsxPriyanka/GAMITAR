const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// CONFIG
const PORT = 4000;
const GRID_SIZE = 10;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// Restriction mode:
const SINGLE_SHOT = false; // set true if you want "once only"
const RESTRICT_SECONDS = 60; // 1 minute

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory shared state
const grid = new Array(TOTAL_CELLS).fill(""); // empty string means blank
const history = []; // append-only
const playersLastSubmit = new Map(); // socketId -> timestamp of last submit (ms)
const playersEverSubmitted = new Set();

// Helper
function getOnlineCount() {
  return io.sockets.sockets.size;
}

// Express endpoints
app.get("/api/grid", (_req, res) => {
  res.json({ grid, size: GRID_SIZE });
});

app.get("/api/history", (_req, res) => {
  res.json({ history });
});

// Optional: get history grouped by second (example)
app.get("/api/history/grouped", (_req, res) => {
  const map = new Map();
  for (const h of history) {
    const sec = Math.floor(h.timestamp / 1000);
    if (!map.has(sec)) map.set(sec, []);
    map.get(sec).push(h);
  }
  const out = Array.from(map.entries()).map(([second, entries]) => ({
    second,
    entries
  }));
  res.json(out);
});

// Socket.IO realtime
io.on("connection", (socket) => {
  // new client connected
  socket.emit("init", { grid, size: GRID_SIZE, history, online: getOnlineCount() });
  io.emit("online_count", { online: getOnlineCount() });

  socket.on("submit_cell", (data, ack) => {
    const { cellIndex, char } = data;
    if (typeof cellIndex !== "number" || cellIndex < 0 || cellIndex >= TOTAL_CELLS) {
      ack?.({ ok: false, reason: "invalid cellIndex" });
      return;
    }
    if (typeof char !== "string" || char.length === 0) {
      ack?.({ ok: false, reason: "invalid char" });
      return;
    }

    const now = Date.now();
    const socketId = socket.id;

    // Restriction check
    if (SINGLE_SHOT) {
      if (playersEverSubmitted.has(socketId)) {
        ack?.({ ok: false, reason: "single-shot: you have already submitted and cannot submit again." });
        return;
      }
    } else {
      const last = playersLastSubmit.get(socketId) ?? 0;
      if (now - last < RESTRICT_SECONDS * 1000) {
        const wait = Math.ceil((RESTRICT_SECONDS * 1000 - (now - last)) / 1000);
        ack?.({ ok: false, reason: `timed restriction: wait ${wait}s` });
        return;
      }
    }

    // Apply update
    grid[cellIndex] = char;
    const entry = { cellIndex, char, by: socketId, timestamp: now };
    history.push(entry);

    playersLastSubmit.set(socket.id, now);
    playersEverSubmitted.add(socket.id);

    io.emit("grid_update", { cellIndex, char, by: socketId, timestamp: now });
    io.emit("history_update", entry);
    io.emit("online_count", { online: getOnlineCount() });

    ack?.({ ok: true, entry });
  });

  socket.on("request_history", (_data, ack) => {
    ack?.({ ok: true, history });
  });

  socket.on("can_submit", (_data, ack) => {
    const socketId = socket.id;
    const now = Date.now();
    if (SINGLE_SHOT) {
      const allowed = !playersEverSubmitted.has(socketId);
      ack?.({ allowed, mode: "single_shot" });
    } else {
      const last = playersLastSubmit.get(socketId) ?? 0;
      const diff = now - last;
      const left = Math.max(0, RESTRICT_SECONDS * 1000 - diff);
      ack?.({ allowed: left === 0, mode: "timed", secondsLeft: Math.ceil(left / 1000) });
    }
  });

  socket.on("disconnect", () => {
    io.emit("online_count", { online: getOnlineCount() });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
