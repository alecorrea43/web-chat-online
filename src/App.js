import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Login from './Pages/login';
import Register from './Pages/register';
import Chat from './Pages/chat';
import ForgotPassword from './Pages/forgot-password';
import ResetPassword from './Pages/reset-password';
import { AuthProvider } from './Pages/AuthContext';



const App = () => {
  return (
     <Router>
       <Routes>
       <Route path="/" element={<Login />} />
         <Route path="/login" element={<Login />} />
        <Link to={Register}></Link>
         <Route path="/forgot-password" element={<ForgotPassword />} />
         <Route path="/reset-password/:token" element={<ResetPassword />} />
         <Route path="/chat/*" element={
           <AuthProvider>
             
               <Chat />
            
           </AuthProvider>
         } />
       </Routes>
     </Router>
  );
 };
 
 export default App;
 