import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

// ✅ Define allowedOrigins BEFORE using it
const allowedOrigins = [
  'http://localhost:5173',
  'https://chat-app-frontend1-ashy.vercel.app'
];

// Create app and server
const app = express();
const server = http.createServer(app);

// ✅ Apply CORS middleware BEFORE routes
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parser
app.use(express.json({ limit: "4mb" }));

// Routes
app.use("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ✅ Initialize Socket.io AFTER allowedOrigins is defined
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// ✅ Track online users
export const userSocketMap = {}; // {userId: [socketId, ...]}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (!userId) return;

  if (!userSocketMap[userId]) userSocketMap[userId] = [];
  userSocketMap[userId].push(socket.id);

  io.emit("onlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    userSocketMap[userId] = userSocketMap[userId].filter(id => id !== socket.id);
    if (userSocketMap[userId].length === 0) {
      delete userSocketMap[userId];
    }
    io.emit("onlineUsers", Object.keys(userSocketMap));
  });
});

// DB Connection + Server Start
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("server is running on " + PORT);
  }
});


export default server;
