import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Snackbar,
  Typography,
  Box,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { styled } from "@mui/system";
import "./styles/estiloForgot.css";


const StyledContainer = styled(Box)({
  display: "flex",
  width: "100%",
  height:"100vh",
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
  width: "75%",
  height:"80%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
 backgroundColor:"#ffffff",
  "@media (max-width: 768px)": {
    width: "100%",
   
  },
});
const StyledFormContainerBox = styled("div")({
  width: "55%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  "@media (max-width: 768px)": {
    width: "95%",
  }
});
const StyledTitle = styled(Typography)({
  textAlign: "center",
  marginBottom: "30px",
});



const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [counter, setCounter] = useState(10);
  const [emailError, setEmailError] = useState("");

  const handleSnackbarClose = () => {
    setError("");
    setSuccess(false);
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const checkExistingRequest = async (email) => {
    try {
      const response = await fetch("https://web-chatonline.netlify.app/check-existing-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la verificación");
      }

      return data.exists;
    } catch (error) {
      console.error("Error en la verificación:", error.message);
      return false;
    }
  };

  const handleForgotPassword = async () => {
    // Validar el campo de correo electrónico
    if (!email) {
      setEmailError("Por favor, ingrese su correo electrónico.");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Por favor, ingrese un correo electrónico válido.");
      return;
    }

    // Limpiar el error del campo de correo electrónico
    setEmailError("");

    // Validar si ya hay una solicitud pendiente
    const hasExistingRequest = await checkExistingRequest(email);
    if (hasExistingRequest) {
      setError("Ya se ha enviado una solicitud para este correo electrónico.");
      return;
    }

    try {
      const response = await fetch("https://web-chatonline.netlify.app/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la solicitud");
      }

      setSuccess(true);
    } catch (error) {
      console.error("Error en la solicitud:", error.message);
      setError(
        error.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo."
      );
    }
  };

  useEffect(() => {
    let timer;
    if (success) {
      timer = setInterval(() => {
        setCounter((prevCounter) => prevCounter - 1);
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [success]);

  useEffect(() => {
    if (counter === 0) {
      window.close();
    }
  }, [counter]);

  return (
    <StyledContainer component="main" maxWidth="xl">
     <StyledFormContainer>
        <StyledFormContainerBox>
          <StyledTitle className="main-title">
            Recuperar contraceña
          </StyledTitle>
          <StyledTitle className="main-text"> 
            Introduzca su correo para restablecer la contraceña.
          </StyledTitle>
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

        <Button
        className="cssButton"
          type="button"
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleForgotPassword}
        >
          Enviar
        </Button>

        <Snackbar
          open={!!error || success}
          autoHideDuration={11000}
          onClose={handleSnackbarClose}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            severity={success ? "success" : "info"}
            onClose={handleSnackbarClose}
          >
            {success
              ? `Se ha enviado un correo electrónico con las instrucciones para restablecer la contraseña. La ventana se cerrará en ${counter} segundos.`
              : error}
          </MuiAlert>
        </Snackbar>
      </StyledFormContainerBox>
        </StyledFormContainer>
    </StyledContainer>
  );
};

export default ForgotPassword;
