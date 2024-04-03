import React, { useState } from 'react';
import { styled } from '@mui/system';
import { Typography, TextField, Button } from '@mui/material';
import CustomAlert from './CustomAlert';

const RegistroContainer = styled('div')({
 height: '100vh',
 display: 'flex',
 flexDirection: 'column',
 justifyContent: 'center',
 alignItems: 'center',
 backgroundColor: '#f5f5f5',
 marginLeft:'16px',
 marginRight:'16px',
 marginTop:'200px',
 color: 'white', 
});

const InnerContainer = styled('div')({
 backgroundColor: '#1C1C1C',
 padding: '20px',
 width: '80%',
 maxWidth: '700px',
 boxShadow: '0 0 20px 0 rgba(0, 0, 0, 0.5)',
});

const StyledButton = styled(Button)({
 backgroundColor: '#C84810',
 color: 'white',
 '&:hover': {
    backgroundColor: '#C84810',
    color: 'white',
 },
});

const NoBorderTextField = ({ ...props }) => (
 <TextField className="NoBorderTextField-root" {...props} />
);

const Registro = () => {
 const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
 });

 const [alertOpen, setAlertOpen] = useState(false);
 const [alertSeverity, setAlertSeverity] = useState('success');
 const [alertMessage, setAlertMessage] = useState('');

 const handleAlertClose = () => {
    setAlertOpen(false);
 };

 const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://web-chat-online.netlify.app/.netlify/functions/registerUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log(data.message);

      if (response.ok) {
        setAlertSeverity('success');
        setAlertMessage('Usuario registrado con éxito');
      } else {
        setAlertSeverity('error');
        setAlertMessage('Error al registrar el usuario. Intenta de nuevo.');
      }

      setAlertOpen(true);
      
    } catch (error) {
      console.error('Error al registrar el usuario:', error);
      setAlertSeverity('error');
      setAlertMessage('Error al registrar el usuario. Intenta de nuevo.');
      setAlertOpen(true);
     
    }
 };

 const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 return (
    <RegistroContainer>
      <InnerContainer>
        <Typography
          variant="h4"
          gutterBottom
          marginBottom={'100px'}
          sx={{
            fontSize: {
              xs: '18px',
              sm: '30px',
            },
          }}>
          Registro de Usuario
        </Typography>
        <form onSubmit={handleSubmit}>
          <NoBorderTextField
            label="Nombre"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            sx={{ marginBottom: 2 }}
          />
          <NoBorderTextField
            label="Correo Electrónico"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            name="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ marginBottom: 2 }}
          />
          <NoBorderTextField
            label="Contraseña"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            required
            name="password"
            value={formData.password}
            onChange={handleChange}
            sx={{ marginBottom: 2 }}
          />
          <StyledButton type="submit" variant="contained" >
            Registrarse
          </StyledButton>
        </form>
        <CustomAlert
          open={alertOpen}
          onClose={handleAlertClose}
          severity={alertSeverity}
          message={alertMessage}
        />
      </InnerContainer>
    </RegistroContainer>
 );
};

export default Registro;