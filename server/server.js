import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);

// ===== ✅ CORRECT CORS CONFIGURATION =====
const allowedOrigins = ["https://chat-app-frontend1-ashy.vercel.app"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
  credentials: true,
}));

// ✅ Manually add CORS headers (Vercel-safe)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://chat-app-frontend1-ashy.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, token");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// ✅ Handle preflight OPTIONS requests globally
app.options("*", cors());

// ===== ✅ SOCKET.IO CONFIGURATION =====
export const io = new Server(server, {
  cors: {
    origin: "https://chat-app-frontend1-ashy.vercel.app",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
});

export const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("disconnect", () => {
    console.log("User disconnected", userId);
    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

// ===== ✅ MIDDLEWARE =====
app.use(express.json({ limit: '4mb' }));

// ===== ✅ ROUTES =====
app.use("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ===== ✅ DB + SERVER START =====
await connectDB();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));
}

export default server;
