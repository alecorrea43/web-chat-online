const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const User = require("/Componentes/User");

exports.handler = async (event) => {
  try {
    const { name, email, password } = JSON.parse(event.body);

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Todos los campos son obligatorios." }),
      };
    }

    const existingUser = await User.findOne({ $or: [{ name }, { email }] });

    if (existingUser) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          error:
            existingUser.name === name
              ? "El nombre de usuario ya está en uso, elige otro."
              : "El correo ya ha sido registrado, crea otro o inicia sesión.",
        }),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    await sendConfirmationEmail(email);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuario registrado exitosamente" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Ha ocurrido algún error. Por favor, vuelve a intentarlo.",
      }),
    };
  }
};

async function sendConfirmationEmail(email) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const msg = {
    to: email,
    from: process.env.GMAIL_USERNAME,
    subject: "Registro exitoso",
    text: "Gracias por registrarte en nuestra aplicación.",
    html: "<p>Gracias por registrarte en nuestra aplicación.</p>",
  };

  const info = await transporter.sendMail(msg);
  console.log("Correo electrónico enviado. Respuesta del servidor:", info);
}
