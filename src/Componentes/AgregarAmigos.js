import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const AgregarAmigos = ({ agregarAmigo, tuTokenDeAutenticacion }) => {
  const [usernameAmigo, setUsernameAmigo] = useState("");
  const [setError] = useState(null);


  const handleInputChange = (event) => {
    setUsernameAmigo(event.target.value);
  };

  const handleAgregarAmigo = async () => {
    try {
      console.log("Token enviado:", tuTokenDeAutenticacion);

      const response = await fetch("http://localhost:3001/agregar-amigo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tuTokenDeAutenticacion}`,
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
      } else if (response.status === 401) {
        setError("Error de autenticación. Por favor, vuelve a iniciar sesión.");
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
    </div>
  );
};


export default AgregarAmigos;
