const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');




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

const db = require('./database');


// Configura con tu clave API
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});



// Ruta de registro
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }
  

  try {
// Verificar si el usuario ya existe
const existingUser = await getUserByUsernameOrEmail(name);
if (existingUser) {
  // El usuario ya existe
  return res.status(200).json({ error: 'El nombre de usuario ya está en uso, elige otro.' });
}
    // Verificar si el usuario ya existe
    const existingEmail = await getUserByUsernameOrEmail(email);
    if (existingEmail) {
      // El usuario ya existe
      return res.status(200).json({ error: 'El correo ya ha sido registrado, crea otro o inicia sesión.' });
    }

    // Hash de la contraseña antes de almacenarla en la base de datos
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    await insertUser(name, email, hashedPassword);

    // Usuario registrado con éxito
    // Envía un correo electrónico de confirmación
    await sendConfirmationEmail(email);

    return res.json({ message: 'Usuario registrado exitosamente' });
  } catch (err) {
    // Identificar y proporcionar mensajes específicos para diferentes tipos de errores
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Error de base de datos: El nombre de usuario o correo electrónico ya está registrado.' });
    } else {
      return res.status(500).json({ error: 'Ha ocurrido algún error. Por favor, vuelve a intentarlo.' });
    }
  }
});

// Ruta de inicio de sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Verificar campos requeridos
  if (!username || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    console.log('Intentando obtener el usuario de la base de datos:', username);
    const user = await getUserByUsernameOrEmail(username);
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
        res.status(401).json({ error: 'Contraseña incorrecta' });
      }
    } else {
      // Usuario no encontrado
      console.log('Usuario no encontrado en la base de datos:', username);
      res.status(401).json({ error: 'Usuario o correo incorrectas' });
    }
  } catch (err) {
    console.error('Error en el servidor:', err);
    res.status(500).json({ error: 'Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.' });
  }
  console.log('A ingresado exitosamente el usuario:', username);
});
//ruta para restablecer contraceña 
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El campo de correo electrónico es obligatorio.' });
  }

  try {
    const user = await getUserByUsernameOrEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Generar un token de recuperación
    const recoveryToken = generateRecoveryToken();

    // Almacenar el token en la base de datos
    await storeRecoveryToken(email, recoveryToken);

    // Enviar un correo electrónico con el enlace de recuperación
    await sendRecoveryEmail(email, recoveryToken);

    return res.json({ message: 'Se ha enviado un correo electrónico con las instrucciones para restablecer la contraseña.' });
  } catch (err) {
    console.error('Error en el servidor:', err);
    return res.status(500).json({ error: 'Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.' });
  }
});


//ruta para setear el password confirmacion 
// Modificación en app.post('/reset-password', ...)
app.route('/reset-password/:token')
  .get(async (req, res) => {
    const { token } = req.params;
    console.log('Valor de token (desde la ruta):', token);
    try {
      // Obtener información del usuario asociada al token
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ error: 'Token de recuperación inválido.' });
      }

      return res.json({ email: user.email });
    } catch (err) {
      console.error('Error en el servidor:', err);
      return res.status(500).json({ error: 'Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.' });
    }
  })
  .put(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
      // Obtener información del usuario asociada al token
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ error: 'Token de recuperación inválido.' });
      }
      const recoveryToken = await getRecoveryToken(user.email, token);
      console.log('RecoveryToken:', recoveryToken);

      if (!recoveryToken || recoveryToken.expiration_time < Date.now()) {
        return res.status(401).json({ error: 'Token de recuperación inválido o expirado.' });
      }
        

      if (!recoveryToken || recoveryToken.expiration_time < Date.now()) {
        return res.status(401).json({ error: 'Token de recuperación inválido o expirado.' });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar la contraseña en la base de datos
      await updatePassword(user.email, hashedPassword);

      // Eliminar el token de recuperación de la base de datos
      await deleteRecoveryToken(user.email);

      return res.json({ message: 'Contraseña restablecida exitosamente.' });
    } catch (err) {
      console.error('Error en el servidor:', err);
      return res.status(500).json({ error: 'Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo.' });
    }
  });

  function generateRecoveryToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expirationTime = Date.now() + 3600000; // 1 hora en milisegundos
  
    console.log('Token generado:', token);
  
    return { token, expirationTime };
  }
  
  async function getUserByToken(token) {
    console.log('Consulta SQL:', 'SELECT * FROM recovery_tokens WHERE token = ?', [token]);
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM recovery_tokens WHERE token = ?', [token], async (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            if (token === row.token) { // Comparación directa sin bcrypt.compare
              resolve(row);
            } else {
              reject(new Error('Invalid token'));
            }
          } else {
            console.log('Token de recuperación no encontrado.');
            resolve(null);
          }
        }
      });
    });
  }
  
  
  



  async function storeRecoveryToken(email, recoveryToken) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO recovery_tokens (email, token, expiration_time) VALUES (?, ?, ?)',
        [email, recoveryToken.token, recoveryToken.expirationTime],
        (err) => {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
              reject(new Error('Ya hay una solicitud de recuperación en progreso para este correo electrónico.'));
            } else {
              reject(err);
            }
          } else {
            console.log('Token almacenado en la base de datos:', recoveryToken.token);
            resolve();
          }
        }
      );
    });
  }
  



  async function getRecoveryToken(email, providedToken) {
    return new Promise((resolve, reject) => {
      console.log('Entrando a getRecoveryToken');
      console.log('Email:', email);
      console.log('Token proporcionado:', providedToken);
  
      db.get('SELECT * FROM recovery_tokens WHERE token = ? AND email = ?', [providedToken, email], async (err, row) => {
        if (err) {
          console.error('Error en la consulta SQL:', err);
          reject(err);
        } else {
          console.log('Valor de token (desde la ruta):', providedToken);
          console.log('Consulta SQL:', db.sql, db.lastID, db.changes);
  
          if (row) {
            console.log('Token almacenado en la base de datos:', row.token);
  
            const validToken = providedToken === row.token;
  
            console.log('Resultado de la comparación:', validToken);
  
            if (validToken) {
              resolve(row);
            } else {
              console.error('Error: El token no coincide.');
              reject(new Error('Invalid token'));
            }
          } else {
            console.log('Token no encontrado en la base de datos.');
            resolve(null);
          }
        }
      });
    });
  }
  
  
// Función para obtener información del usuario a partir del token

function updatePassword(email, newPassword) {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE users SET password = ? WHERE email = ?';
    db.run(sql, [newPassword, email], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
function deleteRecoveryToken(email) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM recovery_tokens WHERE email = ?';
    db.run(sql, [email], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function sendRecoveryEmail(email, recoveryToken) {
  const resetPasswordLink = `${process.env.BASE_URL}/reset-password/${recoveryToken.token}`;
  const msg = {
    to: email,
    from: process.env.GMAIL_USERNAME,
    subject: 'Recuperación de Contraseña',
    text: `Hola, has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: ${resetPasswordLink}`,
    html: `<p>Hola, has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: <a href="${resetPasswordLink}">Restablecer Contraseña</a></p>`,
  };

  return transporter.sendMail(msg);
}




//funcion para poder obtener usuario por nombre 
function getUserByUsernameOrEmail(identifier) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE name = ? OR email = ?', [identifier, identifier], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}
async function sendConfirmationEmail(email) {
  const msg = {
    to: email,
    from: process.env.GMAIL_USERNAME,
    subject: 'Registro exitoso',
    text: 'Gracias por registrarte en nuestra aplicación.',
    html: '<p>Gracias por registrarte en nuestra aplicación.</p>',
  };

  const info = await transporter.sendMail(msg);
  console.log('Correo electrónico enviado. Respuesta del servidor:', info);
};

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
