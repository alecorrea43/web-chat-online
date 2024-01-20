const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS
const corsOptions = {
  origin: '*', // Cambia esto con la URL de tu aplicación React
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());

// Configuración de la base de datos
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

// Crear tabla de usuarios si no existe
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (name TEXT, email TEXT UNIQUE, password TEXT)');
});

// Ruta de registro
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      // El usuario ya existe
      return res.status(200).json({ error: 'El usuario ya está registrado, crea otro o inicia sesión.' });
    }

    // Hash de la contraseña antes de almacenarla en la base de datos
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    await insertUser(name, email, hashedPassword);

    // Usuario registrado con éxito
    return res.json({ message: 'Usuario registrado exitosamente' });
  } catch (err) {
    // Identificar y proporcionar mensajes específicos para diferentes tipos de errores
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Error de base de datos: El correo el usuario ya está registrado.' });
    } else {
      return res.status(500).json({ error: 'Ha ocurrido algún error. Por favor, vuelve a intentarlo.' });
    }
  }
});

// Ruta de inicio de sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Intentando obtener el usuario de la base de datos:', username);
    const user = await getUserByEmail(username);
    console.log('Usuario obtenido:', user);

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        // Usuario autenticado, generar token
        console.log('Generando token para el usuario:', username);
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
      } else {
        // Credenciales incorrectas
        console.log('Credenciales incorrectas para el usuario:', username);
        res.status(401).json({ error: 'Credenciales incorrectas' });
      }
    } else {
      // Usuario no encontrado
      console.log('Usuario no encontrado en la base de datos:', username);
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (err) {
    console.error('Error en el servidor:', err);
    res.status(500).json({ error: 'Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.' });
  }
  console.log('Intento de inicio de sesión para el usuario:', username);
});

// Función para obtener un usuario por su correo electrónico
function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Función para insertar un nuevo usuario en la base de datos
function insertUser(name, email, password) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
