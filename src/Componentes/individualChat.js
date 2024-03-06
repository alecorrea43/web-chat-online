// IndividualChat.js

import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

const IndividualChat = ({ userEmail, socketIdToUserMap, socket }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
   
    useEffect(() => {
       // Escuchar mensajes entrantes
       socket.on('message', (data) => {
         setMessages((prevMessages) => [...prevMessages, data]);
       });
   
       return () => {
         socket.off('message');
       };
    }, [socket]);
   
    const sendMessage = (e) => {
       e.preventDefault();
       if (message) {
         socket.emit('sendMessage', { message, userEmail });
         setMessage('');
       }
    };
   
    return (
       <Box sx={{ padding: 2, width: '100%', maxWidth: 600, margin: 'auto' }}>
         <Typography variant="h4" gutterBottom>
           Chat con {socketIdToUserMap[userEmail]}
         </Typography>
         <Box sx={{ overflowY: 'auto', maxHeight: 400 }}>
           {messages.map((msg, index) => (
             <Box key={index} sx={{ marginBottom: 1 }}>
               <Typography>{msg}</Typography>
             </Box>
           ))}
         </Box>
         <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
           <TextField
             fullWidth
             value={message}
             onChange={(e) => setMessage(e.target.value)}
             placeholder="Escribe un mensaje..."
           />
           <Button variant="contained" color="primary" onClick={sendMessage}>
             Enviar
           </Button>
         </Box>
       </Box>
    );
   };
   
   export default IndividualChat;
   