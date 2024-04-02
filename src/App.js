import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Componentes/login';
import Register from './Componentes/register';
import Chat from './Componentes/chat';
import ForgotPassword from './Componentes/forgot-password';
import ResetPassword from './Componentes/reset-password';
import { AuthProvider } from './Componentes/AuthContext';



const App = () => {
  return (
     <Router>
       <Routes>
         <Route path="/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
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
 