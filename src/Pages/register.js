import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
 const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
 });

 const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const handleSubmit = async (e) => {
    e.preventDefault();
    try {
       
        const response = await axios.post('https://web-chat-online.netlify.app/.netlify/functions/server/register', formData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
      alert(response.data.message);
    } catch (error) {
      alert('Error al registrarse');
    }
 };

 return (
    <div>
      <h2>Registro</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre:
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <label>
          Correo electrónico:
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </label>
        <label>
          Contraseña:
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </label>
        <button type="submit">Registrarse</button>
      </form>
    </div>
 );
};

export default Register;