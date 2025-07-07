import express from 'express'
import cors from 'cors'
import'dotenv/config'
import http from 'http'
import { Server} from 'socket.io'
import {connectDB} from './lib/db.js'
import userRouter from './routes/userRoutes.js'
import messageRouter from './routes/messageRoutes.js'

//create express app and http server
const app = express();
const server = http.createServer(app)

//Initialize socket.io server
export const io = new Server(server,{
  cors:{origin:"*"}
})
//store online user
export const userSocketMap = {}; //{userId: socketId}

//socket.io hanlder
io.on("connection", (socket)=>{
   const userId = socket.handshake.query.userId;
   console.log("User Connected", userId);

   //emit online users to all connected clients
   io.emit("getOnlineUsers",Object.keys(userSocketMap));

   socket.on("disconnect", ()=>{
    console.log("User disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers",Object.keys(userSocketMap))
   })
   
})

//middleware setup
app.use(express.json({limit:'4mb'}));
app.use(cors({
  origin:"https://chat-app-frontend1-ashy.vercel.app",
  credentials:true

}));

//route setup
app.use("/api/status",(req,res)=>res.send("server is live"))
app.use("/api/auth",userRouter)
app.use("/api/messages",messageRouter)


//connect to mongodb
await connectDB()
if(process.env.NODE_ENV !=="production")
{
const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console. log("Server is running on PORT:"
+ PORT));
}

 export default server