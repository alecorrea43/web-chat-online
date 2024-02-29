import React, { useState, useEffect } from "react";
import { Typography, AppBar, Toolbar, IconButton } from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useAuth } from "./AuthContext";
import AgregarAmigos from "./AgregarAmigos";
import "./styles/Chat.css";
import io from "socket.io-client";

const Chat = (props) => {
  const [loggedInUsers, setLoggedInUsers] = useState([]);
  const [open, setOpen] = useState(false);
 
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = location.state?.identifier;
  const authTokenFromLocation = location.state?.authToken;
  const { name } = location.state || {};
  const { authToken } = useAuth();
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [socketIdToUserMap, setSocketIdToUserMap] = useState({});
  const [shouldConnect, setShouldConnect] = useState(false);
  let socket;
  const [userConnectionStatus, setUserConnectionStatus] = useState({});
  
  const handleLogout = (email) => {
    // Verifica si el correo electrónico del usuario está presente y si el usuario está en la lista de usuarios conectados
    if (email && loggedInUsers.some((user) => user.email === email)) {
      handleOpen();
    } else {
      console.error(
        "El usuario no está conectado o no se ha proporcionado un correo electrónico."
      );
    }
  };
 
  const logout = async () => {
    try {
      const token = authToken || authTokenFromLocation;
      const response = await fetch("http://localhost:3001/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      });
  
      if (response.ok) {
        console.log("Sesión cerrada exitosamente");
        
        handleClose();
        navigate("/");
        
        
        if (socket) { 
          socket.emit("userDisconnected", { email: userEmail });
        }
      } else {
        console.error("Error al cerrar sesión:", response.statusText);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  useEffect(() => {
    // Solo conectar si el nombre del usuario está definido
    if (name) {
      setShouldConnect(true);
    }
  }, [name]);
  useEffect(() => {
    if (shouldConnect) {
       const socket = io("http://localhost:3001");
   
       // Emitir el evento 'userConnected' con el nombre del usuario
       socket.emit("userConnected", { email: userEmail, name: name });
   
       // Escucha el evento 'userConnected'
       socket.on("userConnected", (user) => {
         setLoggedInUsers((prevUsers) => {
           const existingUserIndex = prevUsers.findIndex(u => u.email === user.email);
           if (existingUserIndex !== -1) {
             const updatedUsers = [...prevUsers];
             updatedUsers[existingUserIndex] = { ...updatedUsers[existingUserIndex], socketId: user.socketId };
             console.log("Usuario conectado:", user);
             console.log("Lista actualizada de usuarios conectados:", updatedUsers);
             return updatedUsers;
           } else {
             console.log("Usuario conectado:", user);
             console.log("Lista actualizada de usuarios conectados:", [...prevUsers, user]);
             return [...prevUsers, user];
           }
         });
         setSocketIdToUserMap((prevMap) => ({
           ...prevMap,
           [user.socketId]: user.name,
         }));
         // Actualizar el estado de conexión del usuario conectado
         setUserConnectionStatus((prevStatus) => ({
           ...prevStatus,
           [user.socketId]: true,
         }));
       });
   
       // Escucha el evento 'userDisconnected'
       socket.on("userDisconnected", (user) => {
         setLoggedInUsers((prevUsers) => {
           const updatedUsers = prevUsers.filter((u) => u.socketId !== user.socketId);
           console.log("Usuario desconectado:", user);
           console.log("Lista actualizada de usuarios conectados:", updatedUsers);
           return updatedUsers;
         });
         setSocketIdToUserMap((prevMap) => {
           const newMap = { ...prevMap };
           delete newMap[user.socketId];
           return newMap;
         });
         // Actualizar el estado de conexión del usuario desconectado
         setUserConnectionStatus((prevStatus) => ({
           ...prevStatus,
           [user.socketId]: false,
         }));
       });
   
       // Solicita la lista inicial de usuarios conectados al conectarse
       socket.emit("getCurrentUsers");
       socket.on("currentUsers", (users) => {
        console.log("Lista inicial de usuarios conectados recibida:", users);
        setLoggedInUsers(users);
        const updatedSocketIdToUserMap = users.reduce((map, user) => {
           map[user.socketId] = user.name;
           return map;
        }, {});
        setSocketIdToUserMap(updatedSocketIdToUserMap);
        // Actualizar el estado de conexión de los usuarios
        const updatedUserConnectionStatus = users.reduce((status, user) => {
           // Asegúrate de que el estado de conexión se actualice para cada usuario individualmente
           status[user.socketId] = user.connected !== false; // Asume que si no hay propiedad 'connected', el usuario está conectado
           return status;
        }, {});
        setUserConnectionStatus(updatedUserConnectionStatus);
       });
   
       // Limpia los listeners y desconecta el socket cuando el componente se desmonta
       return () => {
         if (socket) {
           socket.off("userConnected");
           socket.off("userDisconnected");
           socket.off("currentUsers");
           socket.disconnect();
         }
       };
    }
   }, [shouldConnect, userEmail, name]);
   

  const agregarAmigo = (newUsers) => {
    setLoggedInUsers(newUsers);
  };

  return (
    <div>
      <div>
        <AppBar position="static" className="appbar1">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ textAlign: "right" }}
            >
              {name}
            </Typography>
            <IconButton
              color="inherit"
              onClick={() => {
                console.log("Correo electrónico del usuario:", userEmail); 
                handleLogout(userEmail);
              }}
            >
              <ExitToAppIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </div>
      <p>Bienvenido al chat en línea. ¡Conéctate y comienza a chatear!</p>

      <h3>Usuarios Conectados:</h3>
      <AgregarAmigos
        agregarAmigo={agregarAmigo}
        tuTokenDeAutenticacion={authToken || authTokenFromLocation}
      />

<ul>
      {loggedInUsers.map((user) => (
        <li key={`${user.email}-${user.socketId}`}>
          {socketIdToUserMap[user.socketId] || 'Usuario desconocido'}
          <span style={{ color: userConnectionStatus[user.socketId] ? "green" : "red" }}>
            ●
          </span>
        </li>
      ))}
    </ul>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirmar Cierre de Sesión</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres cerrar sesión?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>No</Button>
          <Button onClick={logout}>Sí</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Chat;
