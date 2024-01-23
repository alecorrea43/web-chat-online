import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Container,
  Snackbar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [counter, setCounter] = useState(10);

  const handleSnackbarClose = () => {
    setError("");
    setSuccess(false);
  };

  const validateEmail = (email) => {
    // Lógica de validación de correo electrónico, adaptar según sea necesario
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleForgotPassword = async () => {
    if (!email || !validateEmail(email)) {
      setError("Por favor, ingrese un correo electrónico válido.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/forgot-password", {
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
    <Container component="main" maxWidth="xs">
      <div>
        <Typography component="h1" variant="h5">
          Recuperar contraseña
        </Typography>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="email"
          label="Correo Electrónico"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          type="button"
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleForgotPassword}
        >
          Enviar Recuperación
        </Button>

        <Snackbar
          open={!!error || success}
          autoHideDuration={11000}
          onClose={handleSnackbarClose}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            severity={success ? "success" : "error"}
            onClose={handleSnackbarClose}
          >
            {success
              ? `Se ha enviado un correo electrónico con las instrucciones para restablecer la contraseña. La ventana se cerrará en ${counter} segundos.`
              : error}
          </MuiAlert>
        </Snackbar>
      </div>
    </Container>
  );
};

export default ForgotPassword;
