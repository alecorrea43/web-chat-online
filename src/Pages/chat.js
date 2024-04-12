import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Box,
  InputAdornment,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemText,
  List,
  ListItem,
  Badge,
  Link,
  Input,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useNavigate, useLocation } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import "./styles/Chat.css";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { styled } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import SendIcon from "@mui/icons-material/Send";
import MessageIcon from "@mui/icons-material/Message";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import DropdownMenu from "./dropDownMenu";

const StyledInput = styled(InputBase)(({ theme }) => ({
  "& .MuiInputBase-input": {
    position: "relative",
    fontSize: 16,
    width: "100%",
    transition: theme.transitions.create([
      "border-color",
      "background-color",
      "box-shadow",
    ]),
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),

    "&::placeholder": {
      color: "rgba(0, 0, 0, 0.70)", // Aplica el color rgba(0, 0, 0, 0.54) al placeholder
      opacity: 1, // Asegura que el placeholder sea visible
    },
  },
}));

const StyledInput2 = styled(Input)(({ theme }) => ({
  borderRadius: "0px",
  backgroundColor: "#6FAFBC",
  padding: "10px",
  borderBottom: "none", // Elimina el borde inferior
  "&:hover": {
     borderBottom: "#6FAFBC", // Elimina el borde inferior en hover
  },
  "&:focus": {
     borderBottom: "none", // Elimina el borde inferior en focus
  },
  "&:after": {
     // Elimina cualquier estilo after
     display: "none",
  },
  "&:before": {
     // Elimina cualquier estilo before
     borderBottom: "none",
  },
  "& .MuiInputBase-input": {
     // Asegúrate de que el input interno también no tenga borde inferior
     borderBottom: "none",
  },
  '@media (hover: none)': {
     borderBottom: "none", // Asegura que no haya borde inferior en dispositivos que no soportan hover
     "&:hover": {
       borderBottom: "none",
     },
     "&:focus": {
       borderBottom: "none",
     },
     "&:before": {
       borderBottom: "none",
     },
     "& .MuiInputBase-input": {
       borderBottom: "none",
     },
  },
  
  // Añade aquí cualquier otro estilo que desees
 }));

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#80e8f5", // Cambia el color de fondo a negro
    color: "#000", // Cambia el color del texto a blanco
    marginRight: "9px",
  },
}));
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  borderTopRightRadius: "0",
  borderBottomRightRadius: "0",
  borderTopLeftRadius: "0",
  borderBottomLeftRadius: "0",
  border: "none",
  color: "#000",
  fontWeight: "bold",
  padding: "0 30px",
  "&:hover": {
    color: "#80e8f5", // Cambia el color del ícono a gris claro al pasar el mouse
    backgroundColor: "#88C2CE",
  },
  "& .MuiSvgIcon-root": {
    transition: theme.transitions.create("color", {
      duration: theme.transitions.duration.shortest,
    }),
  },
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Usa el color de hover predeterminado de Material-UI
    // Añade un efecto de oscurecimiento más fuerte
  },
}));
const ChatBox = ({ selectedUser, children }) => {
  // Usa selectedUser para alguna lógica condicional aquí
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        wordBreak: "break-word",
      }}
    >
      {children}
    </Box>
  );
};
const StyledMessageIcon = styled(MessageIcon)({
  fontSize: 120, // Ajusta el tamaño del icono
  color: "white", // Cambia el color del icono
});

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
  const [unreadMessages, setUnreadMessages] = useState({});
  const [noResultsMessage, setNoResultsMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [elementWidth, setElementWidth] = useState(null);
  const [isBuscadorListaVisible, setIsBuscadorListaVisible] = useState(true);
  const [isContenedor3Visible, setIsContenedor3Visible] = useState(false);
  const contenedorCajasRef = useRef(null);


  useEffect(() => {
    const handleResize = () => {
       // Ajusta la lógica de visibilidad basada en el tamaño de la ventana
       if (window.innerHeight < window.innerWidth) {
         // El teclado está probablemente abierto
         setIsBuscadorListaVisible(false);
         setIsContenedor3Visible(true);
       } else {
         // El teclado está probablemente cerrado
         setIsBuscadorListaVisible(true);
         setIsContenedor3Visible(false);
       }
    };
   
    window.addEventListener('resize', handleResize);
   
    // Limpieza al desmontar el componente
    return () => {
       window.removeEventListener('resize', handleResize);
    };
   }, []);


  useEffect(() => {
    const handleBackButton = (event) => {
      if (isContenedor3Visible) {
        event.preventDefault();
        setIsContenedor3Visible(false); // Oculta la caja de chat
        setIsBuscadorListaVisible(true); // Muestra la caja de lista
      }
    };

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [isContenedor3Visible, isBuscadorListaVisible]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width >= 641) {
          // Si el ancho es mayor o igual a 641px, ambos contenedores deben ser visibles
          setIsBuscadorListaVisible(true);
          setIsContenedor3Visible(true);
        } else {
          // Si el ancho es menor a 641px, solo caja-buscador-lista debe ser visible
          setIsBuscadorListaVisible(true);
          setIsContenedor3Visible(false);
        }
      }
    });

    if (contenedorCajasRef.current) {
      resizeObserver.observe(contenedorCajasRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentBoxSize[0].inlineSize;
        setElementWidth(width); // Utiliza la función de estado para actualizar el estado con el nuevo ancho
      }
    });

    const divElem = document.querySelector("body > div");
    resizeObserver.observe(divElem);

    return () => {
      resizeObserver.disconnect(); // Desconecta el ResizeObserver al desmontar el componente
    };
  }, []);

  useEffect(() => {
    // Verifica si hay usuarios en la lista
    if (loggedInUsers.length === 0) {
      // Si no hay usuarios, no muestres el mensaje de "No se encontraron resultados"
      setNoResultsMessage("");
      setIsVisible(false);
      return;
    }
    if (searchText) {
      const filteredUsers = loggedInUsers.filter(
        (user) =>
          user.email !== userEmail && // Excluye al usuario actual
          (user.name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase()))
      );

      if (filteredUsers.length === 0) {
        // Muestra el mensaje de "No se encontraron resultados" solo si hay usuarios y no hay resultados de búsqueda
        setNoResultsMessage('"No se encontraron resultados"');
        setIsVisible(true);
        // Establece un temporizador para ocultar el mensaje después de 3 segundos
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 2300);
        return () => clearTimeout(timer); // Limpia el temporizador si el componente se desmonta antes de que el temporizador termine
      } else {
        // Oculta el mensaje de "No se encontraron resultados" si hay resultados de búsqueda
        setNoResultsMessage("");
        setIsVisible(false);
      }
    } else {
      // Si el usuario no ha realizado una búsqueda, no muestres el mensaje de "No se encontraron resultados"
      setNoResultsMessage("");
      setIsVisible(false);
    }
  }, [searchText, loggedInUsers, userEmail]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleUserClick = async (selectedUserEmail) => {
    setLoading(true);
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
          `/.netlify/functions/getMessages?conversationId=${conversationId}`,
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

    await new Promise((resolve) => setTimeout(resolve, 100)); // Simula un retraso
    setLoading(false);

    if (window.innerWidth < 641) {
      setIsBuscadorListaVisible(false);
      setIsContenedor3Visible(true);
    }
  };

  const lastMessageRef = useRef(null);
  useEffect(() => {
    const scrollToLastMessage = () => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Espera un poco para asegurarte de que el contenedor se haya renderizado completamente
    setTimeout(scrollToLastMessage, 10);
  }, [messages, loading]);

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
      const response = await fetch("/.netlify/functions/logout", {
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
      const newSocket = io("https://scientific-intelligent-quality.glitch.me");
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

        if (!message.createdAt) {
          console.error("Timestamp is undefined");
          return; // Evita continuar si 'createdAt' es undefined
        }
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
          // Actualizar el estado de mensajes no leídos
          setUnreadMessages((prevUnreadMessages) => {
            const updatedUnreadMessages = { ...prevUnreadMessages };
            if (updatedUnreadMessages[message.conversationId]) {
              updatedUnreadMessages[message.conversationId] += 1;
            } else {
              updatedUnreadMessages[message.conversationId] = 1;
            }
            return updatedUnreadMessages;
          });
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
          createdAt: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } else {
        console.error("El destinatario no está conectado.");
      }
    }
  };
  console.log("Estado de mensajes:", messages);
  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      console.error("Timestamp is undefined");
      return "Invalid Date";
    }
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.error("Invalid timestamp:", timestamp);
        return "Invalid Date";
      }
      // Obtén la hora en formato de 24 horas
      const hours24 = date.getHours();
      // Determina si es AM o PM
      const period = hours24 >= 12 ? "P.M" : "A.M";
      // Ajusta la hora para el formato de 12 horas si es mayor o igual a 13
      // Pero para el rango de 1 a 24, simplemente usamos la hora directamente
      const formattedHours = hours24;
      // Formatea la hora y el minuto
      const formattedTime = `${formattedHours
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      // Devuelve la hora con el indicador AM/PM
      return `${formattedTime} ${period}`;
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid Date";
    }
  };

  const handleBackToUserList = () => {
    setSelectedUser(null);
    setIsBuscadorListaVisible(true);
    setIsContenedor3Visible(false);
  };

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

      <div className="contenedor-cajas" ref={contenedorCajasRef}>
        {isBuscadorListaVisible && (
          <div className="caja-buscador-lista">
            <div className="caja-superior">
              <Box
                component="form"
                noValidate
                sx={{ width: "100%", height: "100%", display: "flex" }}
              >
                <StyledInput
                  autoComplete="off"
                  placeholder="Buscar usuario"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  fullWidth
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // Previene la acción predeterminada de Enter
                    }
                  }}
                  sx={{ paddingLeft: "13px", paddingRight: "13px" }}
                  endAdornment={
                    // Utiliza la prop endAdornment para agregar el icono al final del input
                    <InputAdornment position="end">
                      {isFocused ? <ArrowForwardIcon /> : <SearchIcon />}
                    </InputAdornment>
                  }
                />
              </Box>
            </div>

            <List
              sx={{
                paddingBottom: "0",
                paddingTop: "0",
                maxHeight: "100%",
                overflowY: "auto",
              }}
            >
              {loggedInUsers
                .filter(
                  (user) =>
                    user.email !== userEmail && // Excluye al usuario actual
                    (user.name
                      .toLowerCase()
                      .includes(searchText.toLowerCase()) ||
                      user.email
                        .toLowerCase()
                        .includes(searchText.toLowerCase()))
                )
                .map((user, index) => {
                  const conversationId = generateConversationId(
                    userEmail,
                    user.email
                  );
                  return (
                    <StyledListItem
                      key={`${user.email}-${user.socketId}`}
                      button
                      onClick={() => {
                        handleUserClick(user.email);
                        setUnreadMessages((prevUnreadMessages) => {
                          const updatedUnreadMessages = {
                            ...prevUnreadMessages,
                          };
                          updatedUnreadMessages[conversationId] = 0; // Restablecer a 0
                          return updatedUnreadMessages;
                        });
                      }}
                    >
                      <span
                        style={{
                          color: userConnectionStatus[user.socketId]
                            ? "green"
                            : "gray",
                          paddingRight: "5px",
                        }}
                      >
                        ●
                      </span>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                          height: "60px",
                        }}
                      >
                        <span>
                          {socketIdToUserMap[user.socketId] ||
                            "Usuario desconocido"}
                        </span>
                        {unreadMessages[conversationId] > 0 && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <StyledBadge
                              badgeContent={unreadMessages[conversationId]}
                            ></StyledBadge>
                          </div>
                        )}
                      </div>
                    </StyledListItem>
                  );
                })}
            </List>
            {noResultsMessage && (
              <ListItem
                sx={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(100%)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center", // Centra el contenido horizontalmente
                    alignItems: "center", // Centra el contenido verticalmente
                    width: "100%", // Asegura que el Box ocupe todo el ancho disponible
                    padding: "10px", // Agrega padding alrededor del contenido
                    backgroundColor: "rgba(0, 0, 0, 0.5)", // Establece el fondo en negro
                    color: "white", // Establece el color del texto en blanco para mejorar la legibilidad
                    textAlign: "center",
                    borderRadius: "8px",
                  }}
                >
                  <ListItemText primary={noResultsMessage} />
                </Box>
              </ListItem>
            )}
          </div>
        )}

        {isContenedor3Visible && (
          <div className="caja-contenedor-3" style={{ width: elementWidth }}>
            <>
              {selectedUser ? (
                <>
                  <div className="usuario-seleccionado">
                    {elementWidth && elementWidth <= 641 && (
                      <IconButton
                        color="inherit"
                        onClick={handleBackToUserList}
                        sx={{
                          marginLeft:
                            elementWidth && elementWidth > 641 ? "20px" : "8px",
                        }}
                      >
                        <ArrowBackIosIcon />
                      </IconButton>
                    )}
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        marginLeft:
                          elementWidth && elementWidth > 641 ? "24px" : "0px",
                      }}
                    >
                      {loggedInUsers.find((user) => user.email === selectedUser)
                        ?.name || "Usuario desconocido"}
                    </Typography>
                    <Box
                      sx={{
                        marginRight:
                          elementWidth && elementWidth > 641 ? "20px" : "8px",
                      }}
                    >
                      <DropdownMenu />
                    </Box>
                  </div>
                  <div className="caja-chat">
                    <ChatBox selectedUser={selectedUser}>
                      {messages
                        .filter(
                          (msg) => msg.conversationId === activeConversation
                        )
                        .map((message, index) => {
                          const linkMatch =
                            message.text.match(/https?:\/\/[^\s]+/g);
                          const linkText = linkMatch ? linkMatch[0] : "";
                          const textAfterLink = message.text
                            .replace(linkText, "")
                            .trim();

                          return (
                            <div
                              className={
                                message.isSender
                                  ? "message-sender-container"
                                  : "message-received-container"
                              }
                              key={index}
                            >
                              <Typography
                                variant="body1"
                                component="div"
                                className={
                                  message.isSender
                                    ? "message-sender"
                                    : "message-received"
                                }
                                ref={
                                  index === messages.length - 1
                                    ? lastMessageRef
                                    : null
                                }
                                sx={{
                                  marginBottom: "6px",
                                  width: "fit-content",
                                  maxWidth: "70%",
                                  fontSize: "16.2px",
                                }}
                              >
                                {linkText && (
                                  <div
                                    style={{
                                      backgroundColor: "#151512",
                                      padding: "5px",
                                      borderRadius: "5px",
                                    }}
                                  >
                                    <Link
                                      href={linkText}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      underline="none"
                                    >
                                      {linkText}
                                    </Link>
                                  </div>
                                )}
                                {textAfterLink && <span>{textAfterLink}</span>}

                                <strong className="timestamp">
                                  {formatTimestamp(message.createdAt)}
                                </strong>
                              </Typography>
                            </div>
                          );
                        })}
                    </ChatBox>
                  </div>
                  <div className="caja-input-buton">
                    <StyledInput2
                      label="Escribir mensaje"
                      multiline={true}
                      maxRows={4}
                      variant="filled"
                      placeholder="Escribir mensaje ..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      fullWidth
                      autoComplete="off"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // Previene la acción predeterminada de Enter
                          sendMessage(); // Llama a la función sendMessage
                        }
                      }}
                    />
                    <StyledIconButton onClick={sendMessage}>
                      <SendIcon />
                    </StyledIconButton>
                  </div>
                </>
              ) : (
                <div className="message-container">
                  <StyledMessageIcon></StyledMessageIcon>
                  <Typography
                    variant="body1"
                    sx={{ fontFamily: '"IBM Plex Mono", sans-serif' }}
                  >
                    Elige un usuario y comienza a chatear
                  </Typography>
                </div>
              )}
            </>
          </div>
        )}
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
