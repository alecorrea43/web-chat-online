import React, { useState, useEffect } from "react";
import {
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Box,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useNavigate, useLocation } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import "./styles/Chat.css";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const Chat = (props) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [loggedInUsers, setLoggedInUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = location.state?.identifier;
  const authTokenFromLocation = location.state?.authToken;
  const { name } = location.state || {};
  const { authToken } = useAuth();
  const [socketIdToUserMap, setSocketIdToUserMap] = useState({});
  const [shouldConnect, setShouldConnect] = useState(false);
  const [userConnectionStatus, setUserConnectionStatus] = useState({});
  const [searchText, setSearchText] = useState("");
  const [socket, setSocket] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleUserClick = async (selectedUserEmail) => {
    console.log("Selected User Email:", selectedUserEmail); // Depuración: Verifica el correo electrónico del usuario seleccionado
    console.log("User Email:", userEmail); // Depuración: Verifica el correo electrónico del usuario actual

    if (selectedUserEmail && selectedUserEmail !== "null") {
      setSelectedUser(selectedUserEmail);
      setRecipient(selectedUserEmail);

      try {
        const token = authToken || authTokenFromLocation;
        console.log("Token:", token); // Depuración: Verifica el token de autenticación

        const conversationId = generateConversationId(
          userEmail,
          selectedUserEmail
        );
        console.log("Actualizando activeConversation a:", conversationId);
        setActiveConversation(conversationId);
        const response = await fetch(
          `http://localhost:3001/messages/${conversationId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Response:", response); // Depuración: Verifica la respuesta del servidor

        if (response.ok) {
          const data = await response.json();
          console.log("Data:", data); // Depuración: Verifica los datos recibidos del servidor
          // Asegúrate de que 'name' es el nombre del usuario actual
          const messagesWithSenderInfo = data.messages.map((message) => ({
            ...message,
            isSender: message.sender === name, // Establece 'isSender' basado en si el 'sender' coincide con el 'name' del usuario actual
          }));
          setMessages(messagesWithSenderInfo);
          setActiveConversation(conversationId); // Actualiza el estado de mensajes con los mensajes recibidos
        } else {
          console.error("Error al cargar los mensajes:", response.statusText);
        }
      } catch (error) {
        console.error("Error al cargar los mensajes:", error);
      }
    } else {
      console.error(
        "El correo electrónico del usuario seleccionado es inválido"
      );
    }
  };
  const handleLogout = (email) => {
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
      console.log("Token de autenticación:", token);
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
        navigate("/login");
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
    if (name) {
      setShouldConnect(true);
    }
  }, [name]);

  useEffect(() => {
    if (shouldConnect) {
      const newSocket = io("http://localhost:3001");
      setSocket(newSocket);

      if (newSocket) {
        newSocket.emit("userConnected", { email: userEmail, name: name });
      }

      newSocket.on("userConnected", (user) => {
        console.log("Socket conectado");
        setLoggedInUsers((prevUsers) => {
          const existingUserIndex = prevUsers.findIndex(
            (u) => u.email === user.email
          );
          if (existingUserIndex !== -1) {
            const updatedUsers = [...prevUsers];
            updatedUsers[existingUserIndex] = {
              ...updatedUsers[existingUserIndex],
              socketId: user.socketId,
            };
            return updatedUsers;
          } else {
            return [...prevUsers, user];
          }
        });
        setSocketIdToUserMap((prevMap) => ({
          ...prevMap,
          [user.socketId]: user.name,
        }));
        setUserConnectionStatus((prevStatus) => ({
          ...prevStatus,
          [user.socketId]: true,
        }));
      });

      newSocket.on("userDisconnected", (user) => {
        setLoggedInUsers((prevUsers) => {
          const updatedUsers = prevUsers.filter(
            (u) => u.socketId !== user.socketId
          );
          return updatedUsers;
        });
        setSocketIdToUserMap((prevMap) => {
          const newMap = { ...prevMap };
          delete newMap[user.socketId];
          return newMap;
        });
        setUserConnectionStatus((prevStatus) => ({
          ...prevStatus,
          [user.socketId]: false,
        }));
      });

      newSocket.emit("getCurrentUsers");
      newSocket.on("currentUsers", (users) => {
        setLoggedInUsers(users);
        const updatedSocketIdToUserMap = users.reduce((map, user) => {
          map[user.socketId] = user.name;
          return map;
        }, {});
        setSocketIdToUserMap(updatedSocketIdToUserMap);
        const updatedUserConnectionStatus = users.reduce((status, user) => {
          status[user.socketId] = user.connected !== false;
          return status;
        }, {});
        setUserConnectionStatus(updatedUserConnectionStatus);
      });
      newSocket.on("message", (message) => {
        console.log("Mensaje recibido:", message);
        const senderName = message.senderName || "Remitente desconocido";
        console.log("Nombre del remitente:", senderName);

        // Verificar si el mensaje pertenece a la conversación activa
        if (message.conversationId === activeConversation) {
          console.log(
            "Actualizando mensajes para la conversación activa:",
            activeConversation
          );
          const isSender = message.sender === name;
          // Actualizar el estado de mensajes localmente
          setMessages((prevMessages) => [
            ...prevMessages,
            { ...message, senderName, isSender },
          ]);
        } else {
          console.log(
            "El mensaje no pertenece a la conversación activa. ConversationId:",
            message.conversationId,
            "Conversation activa:",
            activeConversation
          );
        }
      });

      return () => {
        if (newSocket) {
          newSocket.off("userConnected");
          newSocket.off("userDisconnected");
          newSocket.off("currentUsers");
          newSocket.off("message");
          newSocket.disconnect();
        }
      };
    }
  }, [shouldConnect, userEmail, name, activeConversation]);

  const generateConversationId = (userEmail1, userEmail2) => {
    const sortedEmails = [userEmail1, userEmail2].sort();
    const conversationId = sortedEmails.join("_");
    return conversationId;
  };

  const sendMessage = async () => {
    if (socket && recipient && message && activeConversation) {
      const recipientUser = loggedInUsers.find(
        (user) => user.email === recipient
      );
      if (recipientUser) {
        socket.emit("sendMessage", {
          message,
          recipientSocketId: recipientUser.socketId,
          senderName: name,
          senderEmail: userEmail,
          conversationId: activeConversation,
        });
        setMessage(""); // Limpiar el campo de mensaje después de enviarlo

        // Actualizar el estado de mensajes localmente
        const newMessage = {
          sender: userEmail,
          text: message,
          conversationId: activeConversation,
          isSender: true,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } else {
        console.error("El destinatario no está conectado.");
      }
    }
  };
  console.log("Estado de mensajes:", messages);
  return (
    <div className="caja-padre">
      <AppBar position="static" className="appbar1">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" component="div" sx={{ textAlign: "right" }}>
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
      <div className="contenedor-cajas">
        <div className="caja-buscador-lista">
          <div className="caja-superior">
          <Box component="form" noValidate>
            <TextField
              id="standard-basic"
              variant="standard"
              autoComplete="off"
              className="buscador-usuario"
              label="Buscar usuario"
            
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              fullWidth
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {isFocused ? <ArrowForwardIcon /> : <SearchIcon />}
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          </div>
          <ul className="ul-sin-puntos">
            {loggedInUsers
              .filter(
                (user) =>
                  user.name.toLowerCase().includes(searchText.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchText.toLowerCase())
              )
              .map((user, index) => (
                <li
                  key={`${user.email}-${user.socketId}`}
                  onClick={() => handleUserClick(user.email)}
                >
                  <Box
                    sx={{
                      padding: "18px",
                      borderTop: "1px solid #ccc",
                      borderLeft: "1px solid #ccc",
                      borderRight: "1px solid #ccc",
                      borderBottom:
                        index === loggedInUsers.length - 1
                          ? "1px solid #ccc"
                          : "none",
                    }}
                  >
                    {socketIdToUserMap[user.socketId] || "Usuario desconocido"}
                    <span
                      style={{
                        color: userConnectionStatus[user.socketId]
                          ? "green"
                          : "red",
                      }}
                    >
                      ●
                    </span>
                  </Box>
                </li>
              ))}
          </ul>
        </div>
        <div className="cajaja-contenedora-3">
          {selectedUser && (
            <div className="usuario-seleccionado">
              <Typography
                variant="h6"
                component="div"
                style={{ paddingLeft: "30px" }}
              >
                {loggedInUsers.find((user) => user.email === selectedUser)
                  ?.name || "Usuario desconocido"}
              </Typography>
              <IconButton color="inherit" style={{ marginRight: "25px" }}>
                <MoreVertIcon />
              </IconButton>
            </div>
          )}
          <div className="caja-chat">
            {selectedUser && (
              <>
                {messages
                  .filter((msg) => msg.conversationId === activeConversation)
                  .map((message, index) => (
                    <Typography
                      key={index}
                      variant="body1"
                      component="div"
                      className={
                        message.isSender ? "message-sender" : "message-received"
                      }
                    >
                      <strong></strong> {message.text}
                    </Typography>
                  ))}
              </>
            )}
          </div>
          {selectedUser && (
            <div className="caja-input-buton">
              <TextField
                id="filled-basic"
                label="Escribir mensaje"
                variant="filled"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth// Estilo para quitar el borde y bordes redondeados
              />
              <Button
              
      variant="contained"
      
      onClick={sendMessage}
      style={{
        borderTopRightRadius: '4px', // Border radius solo en la esquina superior derecha
        borderBottomRightRadius: '0', // Sin border radius en la esquina inferior derecha
        borderTopLeftRadius: '0', // Sin border radius en la esquina superior izquierda
        borderBottomLeftRadius: '0', // Sin border radius en la esquina inferior izquierda
        border: 'none', // Quitar el borde
        background: "#000",
       color:"white",
       fontWeight:'bold'
        
      }}
    >
      Enviar
    </Button>
            </div>
          )}
        </div>
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
    </div>
  );
};

export default Chat;
