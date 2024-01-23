// authenticateUser.js
const jwt = require('jsonwebtoken');
const { getUserByToken} = require('./database'); // Asegúrate de tener la función correspondiente para obtener información del usuario

const authenticateUser = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserByToken(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Acceso no autorizado. Token inválido.' });
  }
};

module.exports = authenticateUser;
