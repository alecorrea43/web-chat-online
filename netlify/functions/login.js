const connectDB = require('../../mongodb');
const User = require('../../src/Componentes/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.handler = async function(event, context) {
 if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
 }

 const { email, password } = JSON.parse(event.body);

 if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Email y contraseña son obligatorios.' }),
    };
 }

 try {
    // Asegurarse de que la base de datos esté conectada
    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Usuario no encontrado.' }),
      };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Contraseña incorrecta.' }),
      };
    }

    // Generar y devolver el token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
 } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Ha ocurrido algún error. Por favor, vuelve a intentarlo.',
      }),
    };
 }
};