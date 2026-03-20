import { useState,useEffect } from 'react'
import './App.css'
import Register from "./pages/Register.jsx";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Post from "./pages/Post.jsx";
import Profile from "./pages/Profile.jsx";
import Messages from "./pages/Messages.jsx";
import ProfileOfotheruser from "./pages/ProfileOfotheruser.jsx";
import { ToastProvider, useToast } from "./components/ToastContainer.jsx";

function AppContent() {
  const [count, setCount] = useState(0);
  const [id, setid] = useState("");
  const toast = useToast();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    useEffect(() => {
      fetch("http://localhost:5000/check-auth", {
        credentials: "include",
      })
        .then((res) => {
          if (res.ok){
           setIsLoggedIn(true);
            return res.json();
          }
          else setIsLoggedIn(false);
        }).then((data)=>setid(data.id))
        
    }, []); 
  return (
    <>
      <Routes>
        <Route path="/" element={<Home islogin={isLoggedIn} toast={toast} />} />
        <Route path="/login" element={<Login islogin={isLoggedIn} />} />
        <Route
          path="/post"
          element={<Post islogin={isLoggedIn} id={id} toast={toast} />}
        />
        <Route path="/register" element={<Register islogin={isLoggedIn} />} />
        <Route path="/profile" element={<Profile toast={toast} />} />
        <Route
          path="/u/:username"
          element={<ProfileOfotheruser />}
        />
        <Route path="/messages" element={<Messages />} />
        {/* <Route path="/profile/setting" element={<Profilesetting />} /> */}
      </Routes>
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App
