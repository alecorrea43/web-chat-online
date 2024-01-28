import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Snackbar,
  Box,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { styled } from "@mui/system";
import "./styles/estilos.css";
import videoBackground from "./image/1509404557.mp4";

const StyledContainer = styled(Box)({
  display: "flex",
  width: "100%",
  marginLeft: "auto",
  marginRight: "auto",
  boxSizing: "border-box",
  alignItems: "center",
  justifyContent: "center",
  padding: 0, 
  maxWidth: "100%",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    width: "100%", 
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
const StyledTitle = styled(Typography)({
  textAlign: "center",
  marginBottom: "30px",
});
const StyledFormItem = styled("div")({
  marginBottom: "30px",
  width: "100%", // Ajusta el margen inferior según tus necesidades
});
const StyledTypography = styled(Typography)({
  textAlign: "center",
  marginTop: "20px",
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
    display: "none", // Hide the container on screens <= 768px
  },
});
const VideoBackground = styled("video")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
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

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleRegister = () => {
    // Verificar la conexión a Internet
    if (!navigator.onLine) {
      // No hay conexión, mostrar mensaje de error en rojo
      setSnackbarMessage(
        "No hay conexión a Internet. Por favor, verifica tu conexión."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (!username || !email || !password) {
      // Campos no completos, mostrar mensaje de error en rojo
      setSnackbarMessage(
        "Todos los campos son obligatorios. Por favor, completa todos los campos."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (/\s/.test(username)) {
      setUsernameError(
        "El nombre de usuario no puede contener espacios en blanco."
      );
      return;
    }
    if (/\s/.test(email)) {
      setEmailError(
        "El correo electrónico no puede contener espacios en blanco."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Por favor, ingrese un correo electrónico válido.");
      return;
    }
    if (/\s/.test(password)) {
      setPasswordError("La contraseña no puede contener espacios en blanco.");
      return;
    }
    setEmailError("");
    setUsernameError("");
    setPasswordError("");

    fetch("http://localhost:3001/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: username,
        email,
        password,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("error");
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          // Mostrar mensaje de error en azul
          setSnackbarMessage(data.error);
          setSnackbarSeverity("info");
        } else {
          // Mostrar mensaje de éxito en verde
          setSnackbarMessage(data.message);
          setSnackbarSeverity("success");
        }
        setSnackbarOpen(true); // Mostrar la alerta instantáneamente
      })
      .catch((error) => {
        // Otro manejo de errores en rojo
        setSnackbarMessage(error.message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true); // Mostrar la alerta instantáneamente
      });
  };

  return (
    <StyledContainer component="main" maxWidth="xl">
      <StyledFormContainer>
        <StyledFormContainerBox>
          <StyledTitle component="h1" variant="h5">
            Registrarse
          </StyledTitle>
          <StyledFormItem>
            <TextField
            className="miClasePersonalizada"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nombre de Usuario"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError("");
              }}
              error={!!usernameError}
              helperText={usernameError}
            />
          </StyledFormItem>
          <StyledFormItem>
            <TextField
             className="miClasePersonalizada"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              error={!!emailError}
              helperText={emailError}
            />
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
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              error={!!passwordError}
              helperText={passwordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </StyledFormItem>
          <Button
          className="cssButton"
            type="button"
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleRegister}
          >
            Registrarse
          </Button>
          <StyledTypography variant="body2">
            ¿Ya tienes una cuenta? <Link to="/">Iniciar Sesión</Link>
          </StyledTypography>
        </StyledFormContainerBox>
      </StyledFormContainer>
      <Snackbar
        open={snackbarOpen}
        s
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>

      <StyledImageContainer>
        <VideoBackground autoPlay loop muted>
          <source src={videoBackground} type="video/webm" />
        </VideoBackground>
        <TextOverlay>
          <p className="main-title">Registrate</p>
          <p className="main-text">
            "Explora la experiencia única de nuestra plataforma de chat web en
            línea, donde la comunicación fluye sin problemas. Conéctate con
            personas de todo el mundo de manera instantánea."
            Inicia sesion para usar nuestra web.
          </p>
        </TextOverlay>
      </StyledImageContainer>
    </StyledContainer>
  );
};

export default Register;
