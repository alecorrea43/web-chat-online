// Login.js

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

const StyledContainer = styled(Box)({
  display: "flex",
  height: "100vh",
  width: "100%",
  marginLeft: "auto",
  marginRight: "auto",
  boxSizing: "border-box",
  alignItems: "center",
  justifyContent: "center",
  padding: 0, // Ajusta el valor según tus necesidades
  maxWidth: "100%",
  '@media (max-width: 768px)': {
    flexDirection:"column",
    width:"100%" // Cambia el ancho al 100% cuando la pantalla es más pequeña que 768px
  },
  
});

const StyledFormContainer = styled("div")({
  width: "45%",
  height: "100%",
  backgroundColor: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  '@media (max-width: 768px)': {
    width:"100%" // Cambia el ancho al 100% cuando la pantalla es más pequeña que 768px
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
  height: "100%",
  overflow: "hidden",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  '@media (max-width: 768px)': {
    width:"100%" // Cambia el ancho al 100% cuando la pantalla es más pequeña que 768px
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
  width:"80%",
  height:"30%",
  position: "absolute",
  color: "#ffffff",
   // Color del texto
});

const Login = () => {
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
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

      const response = await fetch("http://localhost:3001/login", {
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

      if (!response.ok) {
        throw new Error(data.error || "Error en la solicitud");
      }

      setError("");
      console.log("Inicio de sesión exitoso");

      if (rememberPassword) {
        localStorage.setItem(`savedPassword_${identifier}`, password);
      }

      navigate("/chat");
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

  return (
    <StyledContainer component="main" maxWidth="xl">
      <StyledFormContainer>
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
          <Typography
            variant="h4"
            style={{ fontFamily: "IBM Plex Mono", fontSize: "60px" }}>
            Chat-web-online
          </Typography>
          <Typography style={{ fontFamily: "IBM Plex Mono" }}>
            "Explora la experiencia única de nuestra plataforma de chat web en
            línea, donde la comunicación fluye sin problemas. Conéctate con
            personas de todo el mundo de manera instantánea, comparte ideas, haz
            nuevos amigos y disfruta de conversaciones en tiempo real. Nuestra
            interfaz intuitiva y fácil de usar te brinda la libertad de
            expresarte y conectarte de una manera divertida y emocionante. Únete
            a la comunidad de nuestro chat web y descubre un espacio vibrante
            donde las conversaciones cobran vida."
          </Typography>
        </TextOverlay>
      </StyledImageContainer>
    </StyledContainer>
  );
};

export default Login;
