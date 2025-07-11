import { createContext, useState } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
import { useEffect } from "react";
import {io} from 'socket.io-client'


const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;
// Right after setting baseURL
console.log("🌍 Backend URL:", backendUrl);
axios.defaults.withCredentials = true;

// ✅ Automatically attach token to every request header
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.token = token; //  req.headers.token
  }
  return config;
});

export const AuthContext = createContext();

export const AuthProvider = ({children})=>{
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Check if user is authenticated and if so, set the user data and connect the socket.
  const checkAuth = async (req, res) => {
    try {
      const { data } = await axios.get("/api/auth/check");

      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  // Login function to handle user authentication and socket connection
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  // Logout function to handle user logout and socket disconnection
  const logout = async () => {
    if (socket) {
      socket.disconnect(); // disconnect socket
      setSocket(null); // clear socket from state
    }
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged out successfully");
  };
  //update profile function to handle user profile updates
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Disconnect old socket if any
  const connectSocket = (userData) => {
    if (!userData) return;

    // Disconnect existing socket (important)
    if (socket) {
      socket.off("getOnlineUsers"); // ❌ avoid duplicate listeners
      socket.disconnect();
    }

    // Create new socket instance
    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      transports: ["websocket"], // Optional but reliable
    });

    // Listen for connection success
    newSocket.on("connect", () => {
      console.log("🔗 Connected to socket:", newSocket.id);
    });

    // Listen for list of online users
    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("Online users from server:", userIds);
      setOnlineUsers(userIds);
    });

    // Optional: Listen for disconnect/errors
    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    setSocket(newSocket); // Save to context state
  };

  useEffect(() => {
    if (token) {
      checkAuth();
    }
  }, [token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}