import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [usuario, setUsuario] = useState({ nombre: '', email: '', password: '' });

  const handleChange = (e) => {
    setUsuario({ ...usuario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://web-chat-online.netlify.app/.netlify/functions/registerUser', usuario);
      console.log(response.data);
      // Aquí puedes redirigir al usuario a la página de inicio de sesión o mostrar un mensaje de éxito
    } catch (error) {
      console.error(error);
      // Aquí puedes manejar errores, como mostrar un mensaje de error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="nombre" placeholder="Nombre" onChange={handleChange} />
      <input type="email" name="email" placeholder="Email" onChange={handleChange} />
      <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
      <button type="submit">Registrarse</button>
    </form>
  );
};

export default Register;