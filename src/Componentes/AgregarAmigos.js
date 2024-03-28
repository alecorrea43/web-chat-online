import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const AgregarAmigos = ({ agregarAmigo, tuTokenDeAutenticacion }) => {
  const [usernameAmigo, setUsernameAmigo] = useState("");
  const [error, setError] = useState(null);
  const jwtSecret = process.env.REACT_APP_JWT_SECRET;

  
  const handleInputChange = (event) => {
    setUsernameAmigo(event.target.value);
    setError(null);
  };

  const handleAgregarAmigo = async () => {
    try {

      const response = await fetch("https://app.netlify.com/sites/web-chat-online/server.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tuTokenDeAutenticacion || jwtSecret}`,
        },
        body: JSON.stringify({
          friendUsername:  usernameAmigo,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        agregarAmigo(data.friends);
        setUsernameAmigo("");
        console.log(data.message);
      } else if (response.status === 404) {
        setError("Usuario no encontrado.");
      } else if (response.status === 200) {
        setError("Este usuario ya está en tu lista de amigos.");
      } else {
        console.error("Error al agregar amigo:", response.statusText);
      }
    } catch (error) {
      console.error("Error al agregar amigo:", error);
    }
  };
  return (
    <div>
      <TextField
        label="Agregar amigo"
        variant="outlined"
        value={usernameAmigo}
        onChange={handleInputChange}
      />
      <Button variant="contained" onClick={handleAgregarAmigo}>
        Agregar
      </Button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};


export default AgregarAmigos;
