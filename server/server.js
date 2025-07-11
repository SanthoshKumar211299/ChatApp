import express from 'express'
import 'dotenv/config.js'
import cors from 'cors'
import http from 'http'
import {connectDB} from './lib/db.js'
import userRouter from './routes/userRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import { Server } from 'socket.io'
import connectCloudinary from './lib/cloudinary.js'


const app = express();
const server = http.createServer(app)

export const io = new Server(server,{
  path: "/socket.io",
  cors:{
    origin: 'https://chat-app-frontend1-ashy.vercel.app', // ✅ Your Vercel frontend
    credentials: true,
    methods: ['GET', 'POST']
  }
})



export const userSocketMap = {}; //{userId: socketId}
//socket.io hanlder
io.on("connection", (socket)=>{
   const userId = socket.handshake.query.userId;
   console.log("User Connected", userId);
   if (userId) {
    userSocketMap[userId] = socket.id; // Store user properly
     //emit online users to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap));
   }
   socket.on("disconnect", ()=>{
    console.log("User disconnected", userId);
      if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
    
   })
   
})

//middleware setup

app.use(express.json({limit:"4mb"}));
app.use(cors({
  origin: 'https://chat-app-frontend1-ashy.vercel.app',  //  your Vercel frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'token']
}));

//Route


app.use("/api/auth", userRouter)
app.use("/api/message",messageRouter)

app.use("/",(req,res)=>{
  res.send(
    "Server is Live"
  )
})
await connectDB();
connectCloudinary();

const PORT = process.env.PORT || 5000;

server.listen(PORT,()=> console.log("Server is running on PORT:" + PORT));

export default server;