import videoBackground from "./image/1509404557.mp4";
import "./styles/styles.css";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Snackbar,
  Checkbox,
  FormControlLabel,
  FormHelperText,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { styled } from "@mui/system";
import io from 'socket.io-client';

const StyledContainer = styled(Box)({
  display: "flex",
  width: "100%",
  marginLeft: "auto",
  marginRight: "auto",
  boxSizing: "border-box",
  alignItems: "center",
  justifyContent: "center",
  padding: 0, // Ajusta el valor según tus necesidades
  maxWidth: "100%",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    width: "100%", // Cambia el ancho al 100% cuando la pantalla es más pequeña que 768px
  },
});

const StyledFormContainer = styled("div")({
  width: "45%",
  height: "100vh",
  backgroundColor: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  order: 1, // Cambia el orden para pantallas más pequeñas
  "@media (max-width: 768px)": {
    width: "100%",
    order: 2, // Cambia el orden para pantallas más pequeñas
  },
});
const StyledFormContainerBox = styled("div")({
  width: "80%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
});
const StyledImageContainer = styled("div")({
  width: "55%",
  height: "100vh",
  overflow: "hidden",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  order: 2, // Cambia el orden para pantallas más pequeñas
  "@media (max-width: 768px)": {
    width: "100%",
    order: 1, // Cambia el orden para pantallas más pequeñas
  },
});
const VideoBackground = styled("video")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});
const StyledFormItem = styled("div")({
  marginBottom: "30px",
  width: "100%", // Ajusta el margen inferior según tus necesidades
});

const StyledTitle = styled(Typography)({
  textAlign: "center",
  marginBottom: "30px",
});

const StyledTypography = styled(Typography)({
  textAlign: "center",
  marginTop: "20px",
});
const StyledGrid = styled(Grid)({
  marginBottom: "20px", // Ajusta el margen inferior según tus necesidades
});
const TextOverlay = styled("div")({
  width: "80%",
  height: "80%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  position: "absolute",
  color: "#ffffff",
  textAlign: "center",
  boxSizing: "border-box",
});


const Login = () => {
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();
  

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
 

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError("Por favor, complete todos los campos antes de iniciar sesión.");
      setSnackbarOpen(true);
      return;
    }

    try {
      setIdentifierError("");

      const response = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: identifier,
          password: password,
        }),
      });

      const data = await response.json();
      console.log("Datos del usuario:", data);
      if (!response.ok) {
        throw new Error(data.error || "Error en la solicitud");
      }
      const socket = io("/.netlify/functions/socketServer");
      socket.emit("userConnected", { email: data.email });
      setError("");

      console.log("Inicio de sesión exitoso");

      const authToken = data.token;
      const username = data.name; 
      const userEmail = data.email;

      localStorage.setItem(`loggedInUser_${userEmail}`, userEmail);
      localStorage.setItem(`authToken_${userEmail}`, authToken);

    localStorage.setItem(`loggedInUser_${username}`, username);

    if (rememberPassword) {
      localStorage.setItem(`savedPassword_${identifier}`, password);
    }
 

    navigate("/chat", { state: { authToken, identifier: userEmail, name: username } });


  
    } catch (error) {
      console.error("Error en la solicitud:", error.message);

      if (error.message === "Usuario o correo incorrectas") {
        setIdentifierError("Usuario o correo incorrectos.");
        setPasswordError("");
      } else if (error.message === "Contraseña incorrecta") {
        setIdentifierError("");
        setPasswordError("Contraseña incorrecta.");
      } else {
        setError(
          error.message ||
            "Ha ocurrido un error. Por favor, inténtalo de nuevo."
        );
        setSnackbarOpen(true);
      }
    }
  };



  useEffect(() => {
    const savedPassword = localStorage.getItem(`savedPassword_${identifier}`);
    if (savedPassword && identifier) {
      setPassword(savedPassword);
    }
  }, [identifier]);

  useEffect(() => {
    const handleResize = () => {
      setShowButton(window.innerWidth < 768); // Invertir la lógica para mostrar el botón cuando el ancho sea menor a 768
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // El array vacío asegura que este efecto solo se ejecute una vez al montar el componente

  const handleButtonClick = () => {
    window.location.href = "#miSeccion";
  };

  

  return (
    <StyledContainer component="main" maxWidth="xl">
      <StyledFormContainer id="formulario">
        <StyledFormContainerBox>
          <StyledTitle component="h1" variant="h5">
            Iniciar Sesión
          </StyledTitle>
          <StyledFormItem>
            <TextField
              className="miClasePersonalizada"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="identifier"
              label="Usuario o Correo Electrónico"
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setIdentifierError("");
              }}
              error={!!identifierError}
            />
            <FormHelperText error>{identifierError}</FormHelperText>
          </StyledFormItem>
          <StyledFormItem>
            <TextField
              className="miClasePersonalizada"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              error={!!passwordError}
            />
            <FormHelperText error>{passwordError}</FormHelperText>
          </StyledFormItem>

          <StyledGrid
            container
            justifyContent="space-between"
            alignItems="center"
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberPassword}
                  onChange={() => setRememberPassword(!rememberPassword)}
                />
              }
              label="Recordar Contraseña"
            />
            <Typography variant="body2">
              <Link to="/forgot-password" target="_blank">
                ¿Olvidaste tu contraseña?
              </Link>
            </Typography>
          </StyledGrid>

          <Button
            type="button"
            fullWidth
            variant="contained"
            className="cssButton"
            onClick={handleLogin}
          >
            Iniciar Sesión
          </Button>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
          >
            <MuiAlert
              elevation={6}
              variant="filled"
              severity="error"
              onClose={handleSnackbarClose}
            >
              {error}
            </MuiAlert>
          </Snackbar>
          <StyledTypography variant="body2">
            ¿No tienes una cuenta? <Link to="/register">Registrarse</Link>
          </StyledTypography>
        </StyledFormContainerBox>
      </StyledFormContainer>
      <StyledImageContainer>
        <VideoBackground autoPlay loop muted>
          <source src={videoBackground} type="video/webm" />
        </VideoBackground>
        <TextOverlay>
          <p className="main-title">Chat-web-online</p>
          <p className="main-text">
            "Explora la experiencia única de nuestra plataforma de chat web en
            línea, donde la comunicación fluye sin problemas. Conéctate con
            personas de todo el mundo de manera instantánea." Inicia sesion para
            usar nuestra web.
          </p>
          {showButton && (
            <Button
              type="button"
              fullWidth
              variant="contained"
              className="cssButton2"
              onClick={() => {
                handleButtonClick();
                // Lógica para desplazarse hacia la sección del formulario
                const formularioSection = document.getElementById("formulario");
                if (formularioSection) {
                  formularioSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Empezar
            </Button>
          )}
        </TextOverlay>
      </StyledImageContainer>
    </StyledContainer>
  );
};


export default Login;