// Login.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Container, Grid } from '@mui/material';
import { styled } from '@mui/system';

const StyledContainer = styled(Container)({
  marginTop: theme => theme.spacing(4),
});

const StyledForm = styled('form')({
  width: '100%',
  marginTop: theme => theme.spacing(1),
});

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      console.log('Por favor, ingrese nombre de usuario y contraseña.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la solicitud');
      }

      const data = await response.json();

      if (data.error) {
        console.log(data.error);
      } else {
        console.log('Inicio de sesión exitoso');

        localStorage.setItem('jwtToken', data.token);
        navigate.push('/chat');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error.message);
    }
  };

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
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="button"
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleLogin}
          >
            Iniciar Sesión
          </Button>
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
