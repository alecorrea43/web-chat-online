import React, { useState, useEffect } from "react";
import {
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Box,
  TextField,
  InputAdornment,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useAuth } from "./AuthContext";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import "./styles/Chat.css";
import io from "socket.io-client";
import IndividualChat from "./individualChat";

const Chat = (props) => {
  const [loggedInUsers, setLoggedInUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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
  const [userConnectionStatus, setUserConnectionStatus] = useState({});
  const [searchText, setSearchText] = useState("");
  const [socket, setSocket] = useState(null);

  const handleUserClick = (userEmail) => {
    setSelectedUser(userEmail);
  };

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
      const newSocket = io("http://localhost:3001");
      setSocket(newSocket);

      // Emitir el evento 'userConnected' con el nombre del usuario
      if (newSocket) {
        newSocket.emit("userConnected", { email: userEmail, name: name });
      }
      // Escucha el evento 'userConnected'
      newSocket.on("userConnected", (user) => {
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
            console.log("Usuario conectado:", user);
            console.log(
              "Lista actualizada de usuarios conectados:",
              updatedUsers
            );
            return updatedUsers;
          } else {
            console.log("Usuario conectado:", user);
            console.log("Lista actualizada de usuarios conectados:", [
              ...prevUsers,
              user,
            ]);
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
      newSocket.on("userDisconnected", (user) => {
        setLoggedInUsers((prevUsers) => {
          const updatedUsers = prevUsers.filter(
            (u) => u.socketId !== user.socketId
          );
          console.log("Usuario desconectado:", user);
          console.log(
            "Lista actualizada de usuarios conectados:",
            updatedUsers
          );
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
      newSocket.emit("getCurrentUsers");
      newSocket.on("currentUsers", (users) => {
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
        if (newSocket) {
          newSocket.off("userConnected");
          newSocket.off("userDisconnected");
          newSocket.off("currentUsers");
          newSocket.disconnect();
        }
      };
    }
  }, [shouldConnect, userEmail, name]);

  return (
    <div className="caja-padre">
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
      <div>
        <Box component="form" noValidate>
          <TextField
            id="filled-basic"
            autoComplete="off"
            className="buscador-usuario"
            label="Buscar usuario"
            variant="filled"
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
        {selectedUser && socket && (
          <IndividualChat
            userEmail={selectedUser}
            socketIdToUserMap={socketIdToUserMap}
            socket={socket}
          />
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
  );
};

export default Chat;
