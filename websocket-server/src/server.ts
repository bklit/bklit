import { config } from "dotenv";
import { createServer } from "http";
import Redis from "ioredis";
import { Server } from "socket.io";

config();

const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const PORT = Number(process.env.PORT) || 6001;
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(",") || [
  "https://app.bklit.com",
  "http://localhost:3000",
];

// Redis clients with explicit config
const redisConfig = REDIS_PASSWORD
  ? { host: "127.0.0.1", port: 6379, password: REDIS_PASSWORD }
  : { host: "127.0.0.1", port: 6379 };

const redis = new Redis(redisConfig);
const subscriber = redis.duplicate();

// HTTP server
const httpServer = createServer();

// Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGINS,
    credentials: true,
  },
});

// Connection tracking
let connectionCount = 0;
const roomCounts = new Map<string, number>();

io.on("connection", (socket) => {
  connectionCount++;
  console.log(
    `[${new Date().toISOString()}] Client connected: ${socket.id} (Total: ${connectionCount})`
  );

  socket.on("join_project", (projectId: string) => {
    const room = `project:${projectId}`;
    socket.join(room);

    const count = (roomCounts.get(room) || 0) + 1;
    roomCounts.set(room, count);

    console.log(`Socket ${socket.id} joined ${room} (${count} clients)`);
  });

  socket.on("leave_project", (projectId: string) => {
    const room = `project:${projectId}`;
    socket.leave(room);

    const count = Math.max(0, (roomCounts.get(room) || 0) - 1);
    if (count === 0) {
      roomCounts.delete(room);
    } else {
      roomCounts.set(room, count);
    }

    console.log(`Socket ${socket.id} left ${room} (${count} clients)`);
  });

  socket.on("disconnect", () => {
    connectionCount--;
    console.log(
      `[${new Date().toISOString()}] Client disconnected: ${socket.id} (Total: ${connectionCount})`
    );
  });
});

// Subscribe to Redis pub/sub
subscriber.subscribe("live-events", (err) => {
  if (err) {
    console.error("Failed to subscribe to live-events:", err);
    process.exit(1);
  }
  console.log("[STARTUP] Subscribed to live-events channel");
});

subscriber.on("message", (channel, message) => {
  try {
    const event = JSON.parse(message);
    const room = `project:${event.projectId}`;
    const clientCount = roomCounts.get(room) || 0;

    if (clientCount > 0) {
      io.to(room).emit(event.type, event.data);
      console.log(`[EVENT] ${event.type} → ${room} (${clientCount} clients)`);
    }
  } catch (error) {
    console.error("Error processing Redis message:", error);
  }
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[STARTUP] Socket.IO server listening on 0.0.0.0:${PORT}`);
  console.log(`[STARTUP] Node version: ${process.version}`);
  console.log(
    `[STARTUP] Environment: ${process.env.NODE_ENV || "development"}`
  );
  console.log("[STARTUP] CORS origins:", CORS_ORIGINS);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] SIGTERM received");
  httpServer.close(() => {
    redis.quit();
    subscriber.quit();
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[SHUTDOWN] SIGINT received");
  httpServer.close(() => {
    redis.quit();
    subscriber.quit();
    process.exit(0);
  });
});
