import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Container,
  Box,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);
  

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        if (!token) {
          setError('Token no definido. Asegúrate de proporcionar un token válido.');
          return;
        }

        const response = await fetch(`http://localhost:3001/reset-password/${token}`);
        const data = await response.json();

        if (response.ok) {
          setUserEmail(data.email);
        } else {
          setError(data.error || 'Ha ocurrido un error al obtener la información del usuario.');
        }
      } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        setError('Ha ocurrido un error al obtener la información del usuario.');
      }
    };

    fetchUserEmail();
  }, [token]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
  
    // Validación de espacios en la contraseña
    if (newPassword.includes(' ')) {
      setError('La nueva contraseña no puede contener espacios.');
      setOpenSnackbar(true);
      return;
    }
  
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      setOpenSnackbar(true);
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:3001/reset-password/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setSuccessMessage(data.message); // Usa el mensaje del servidor
        setError(''); 
        setOpenSnackbar(true);
        setShouldClose(true);
      
      } else {
        setError(data.error || 'Ha ocurrido un error al restablecer tu contraseña. Por favor, inténtalo de nuevo más tarde.');
        setOpenSnackbar(true);
      }
    } catch (error) {
      setError('Ha ocurrido un error en la solicitud. Por favor, inténtalo de nuevo más tarde.');
      setOpenSnackbar(true);
    }
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    if (shouldClose) {
      const timeoutId = setTimeout(() => {
        setOpenSnackbar(false);
        window.close();
      }, 2000);

      return () => clearTimeout(timeoutId); // Limpiar el temporizador si el componente se desmonta antes de que se complete
    }
  }, [shouldClose]);


  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: (theme) => theme.spacing(4),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5">Restablece tu contraseña</Typography>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert
            severity={error ? 'error' : 'success'}
            onClose={handleSnackbarClose}
          >
            {error || successMessage}
          </Alert>
        </Snackbar>
        {userEmail && (
          <form onSubmit={handleResetPassword} style={{ width: '100%', marginTop: '8px' }}>
            <TextField
              label="Nueva Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              fullWidth
              required
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
            <Button type="submit" variant="contained" color="primary" style={{ width: '100%'}}>
              Restablecer Contraseña
            </Button>
          </form>
        )}
      </Box>
    </Container>
  );
};

export default ResetPassword;
