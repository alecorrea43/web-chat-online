import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Box,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from "@mui/system";
import "./styles/estiloReset.css";

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
    const validateToken = async () => {
      try {
        if (!token) {
          setError('Token no definido. Asegúrate de proporcionar un token válido.');
          return;
        }

        const response = await fetch(`/.netlify/functions/validToken/${token}`);
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

    validateToken();
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
      const response = await fetch(`/.netlify/functions/restePassword/${token}`, {
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
    <StyledContainer component="main" maxWidth="xl">
    <StyledFormContainer>
       <StyledFormContainerBox>
         <StyledTitle className="main-title">
           Restablece tu contraceña
         </StyledTitle>
         <StyledTitle className="main-text"> 
           Introduzca la nueva contraceña.
         </StyledTitle>
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
            className="miClasePersonalizada"
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
            <Button
            className="cssButton" type="submit" variant="contained" style={{ width: '100%'}}>
              Restablecer Contraseña
            </Button>
          </form>
        )}
      </StyledFormContainerBox>
      </StyledFormContainer>
    </StyledContainer>
  );
};

export default ResetPassword;
