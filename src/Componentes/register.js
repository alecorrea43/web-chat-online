import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField, Button, Typography, Container, Grid, Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';


const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('');

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleRegister = () => {
    // Verificar la conexión a Internet
    if (!navigator.onLine) {
      // No hay conexión, mostrar mensaje de error en rojo
      setSnackbarMessage('No hay conexión a Internet. Por favor, verifica tu conexión.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (!username || !email || !password) {
      // Campos no completos, mostrar mensaje de error en rojo
      setSnackbarMessage('Todos los campos son obligatorios. Por favor, completa todos los campos.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    fetch('http://localhost:3001/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: username,
        email,
        password,
      }),
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('error');
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        // Mostrar mensaje de error en azul
        setSnackbarMessage(data.error);
        setSnackbarSeverity('info');
      } else {
        // Mostrar mensaje de éxito en verde
        setSnackbarMessage(data.message);
        setSnackbarSeverity('success');
      }
      setSnackbarOpen(true);
    })
    .catch((error) => {
      // Otro manejo de errores en rojo
      setSnackbarMessage(error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    });
  };

  return (
    <Container component="main" maxWidth="xs">
      <div>
        <Typography component="h1" variant="h5">
          Registrarse
        </Typography>
        <form noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            label="Nombre de Usuario"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
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
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="button"
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleRegister}
          >
            Registrarse
          </Button>
        </form>
        <Grid container justify="flex-end">
          <Grid item>
            <Typography variant="body2">
              ¿Ya tienes una cuenta? <Link to="/">Iniciar Sesión</Link>
            </Typography>
          </Grid>
        </Grid>
      </div>
      <Snackbar
        open={snackbarOpen}
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
    </Container>
  );
};

export default Register;
