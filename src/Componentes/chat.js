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
  const { authToken, username: storedUsername } = useAuth();
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  let socket;
  
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
        
        // Emitir el evento 'userDisconnected' al servidor
        if (socket) { // Asegúrate de que socket esté definido antes de emitir
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
    const socket = io("http://localhost:3001");
    socket.emit("userConnected", { email: userEmail });

    // Escucha el evento 'userConnected'
    socket.on("userConnected", (user) => {
      setLoggedInUsers((prevUsers) => {
        const updatedUsers = [...prevUsers, user];
        console.log("Usuario conectado:", user);
        console.log("Lista actualizada de usuarios conectados:", updatedUsers);
        return updatedUsers;
      });
    });

    // Escucha el evento 'userDisconnected'
    socket.on("userDisconnected", (user) => {
      setLoggedInUsers((prevUsers) => {
        const updatedUsers = prevUsers.filter((u) => u.email !== user.email);
        console.log("Usuario desconectado:", user);
        console.log("Lista actualizada de usuarios conectados:", updatedUsers);
        return updatedUsers;
      });
    });

    // Solicita la lista inicial de usuarios conectados al conectarse
    socket.emit("getCurrentUsers");

    // Escucha el evento 'currentUsers'
    socket.on("currentUsers", (users) => {
      setLoggedInUsers(users);
      console.log("Lista inicial de usuarios conectados:", users);
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
  }, [userEmail]);

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
                console.log("Correo electrónico del usuario:", userEmail); // Asegúrate de que userEmail no sea undefined
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
        {loggedInUsers
          .filter((user) => user.name !== storedUsername)
          .map((user) => (
            <li key={user.email}>
              {user.name}
              <span style={{ color: user.connected ? "green" : "red" }}>
                {" "}
                ●{" "}
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
