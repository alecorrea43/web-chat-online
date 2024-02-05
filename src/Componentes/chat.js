import React, { useState, useEffect } from "react";
import { useNavigate, useLocation  } from "react-router-dom";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useAuth } from "./AuthContext";
import AgregarAmigos from "./AgregarAmigos";
import "./styles/Chat.css";

const Chat = () => {
  const { authToken } = useAuth();
  const [loggedInUsers, setLoggedInUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const authTokenFromLocation = location.state?.authToken;


  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleLogout = (email) => {
    setUserEmail(email);
    handleOpen();
  };



  const logout = async () => {
    try {
      const response = await fetch("http://localhost:3001/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      });

      if (response.ok) {
        const updatedLoggedInUsers = loggedInUsers.map((user) => {
          if (user.email === userEmail) {
            return { ...user, connected: false };
          }
          return user;
        });

        // Actualizar el estado y almacenar en localStorage
        setLoggedInUsers(updatedLoggedInUsers);
        localStorage.setItem(
          "loggedInUsers",
          JSON.stringify(updatedLoggedInUsers)
        );

        // Limpiar el estado del correo electrónico al cerrar sesión
        setUserEmail("");

        // Cerrar el diálogo
        handleClose();
        navigate("/");
      } else {
        console.error("Error al cerrar sesión:", response.statusText);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const fetchLoggedInUsers = async () => {
    try {
      const response = await fetch("http://localhost:3001/logged-in-users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLoggedInUsers(data.users);
        localStorage.setItem("loggedInUsers", JSON.stringify(data.users));
        return data.users;
      } else {
        console.error("Error fetching logged-in users:", response.statusText);
        return [];
      }
    } catch (error) {
      console.error("Error fetching logged-in users:", error);
      return [];
    }
  };

  useEffect(() => {
    // Obtener el estado almacenado en localStorage al cargar la página
    const storedLoggedInUsers =
      JSON.parse(localStorage.getItem("loggedInUsers")) || [];
    setLoggedInUsers(storedLoggedInUsers);

    const intervalId = setInterval(() => {
      fetchLoggedInUsers();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const agregarAmigo = (newUsers) => {
    setLoggedInUsers(newUsers);
  };

  return (
    <div>
      <div>
        {/* Agregar un AppBar */}
        <AppBar position="static" className="appbar1">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            {/* Mostrar el nombre de usuario a la derecha */}
            <Typography
              variant="h6"
              component="div"
              sx={{ textAlign: "right" }}
            >
              {loggedInUsers.length > 0 && loggedInUsers[0].name}
            </Typography>
            {/* Agregar el botón de cerrar sesión como un IconButton */}
            <IconButton
              color="inherit"
              onClick={() => handleLogout(loggedInUsers[0].email)}
            >
              <ExitToAppIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </div>
      <p>Bienvenido al chat en línea. ¡Conéctate y comienza a chatear!</p>

      <h3>Usuarios Conectados:</h3>
      <AgregarAmigos agregarAmigo={agregarAmigo} tuTokenDeAutenticacion={authToken || authTokenFromLocation} />

      <ul>
        {loggedInUsers
          .filter((user) => user.email !== loggedInUsers[0].email) // Filtrar el usuario actual
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
