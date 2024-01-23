import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Container,
  Grid,
  Snackbar,
  Checkbox,
  FormControlLabel,
  FormHelperText,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { styled } from "@mui/system";

const StyledContainer = styled(Container)({
  marginTop: (theme) => theme.spacing(4),
});

const StyledForm = styled("form")({
  width: "100%",
  marginTop: (theme) => theme.spacing(1),
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
      setIdentifierError(""); // Restablece el error en caso de que haya tenido éxito anteriormente

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

      setError(""); // Limpiar cualquier mensaje de error anterior

      console.log("Inicio de sesión exitoso");

      // Almacenar la contraseña solo si la opción de recordar está activada
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
    // Leer la contraseña del almacenamiento local cuando el nombre de usuario cambia
    const savedPassword = localStorage.getItem(`savedPassword_${identifier}`);
    if (savedPassword && identifier) {
      setPassword(savedPassword);
    }
  }, [identifier]);

  return (
    <StyledContainer component="main" maxWidth="xs">
      <div>
        <Typography component="h1" variant="h5">
          Iniciar Sesión
        </Typography>
        <StyledForm noValidate>
          <TextField
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
              setIdentifierError(""); // Limpiar el mensaje de error al cambiar el identificador
            }}
            error={!!identifierError}
          />
          <FormHelperText error>{identifierError}</FormHelperText>
          <TextField
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
          <Grid container justifyContent="space-between" alignItems="center">
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberPassword}
                  onChange={() => setRememberPassword(!rememberPassword)}
                  color="primary"
                />
              }
              label="Recordar Contraseña"
            />
            <Typography variant="body2">
              <Link to="/forgot-password" target="_blank">
                ¿Olvidaste tu contraceña?
              </Link>
            </Typography>
          </Grid>

          <Button
            type="button"
            fullWidth
            variant="contained"
            color="primary"
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
        </StyledForm>
        <Grid container justify="flex-end">
          <Grid item>
            <Typography variant="body2">
              ¿No tienes una cuenta? <Link to="/register">Registrarse</Link>
            </Typography>
          </Grid>
        </Grid>
      </div>
    </StyledContainer>
  );
};

export default Login;
