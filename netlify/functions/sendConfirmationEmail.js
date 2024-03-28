const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  const { email } = JSON.parse(event.body);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
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

  try {
    const info = await transporter.sendMail(msg);
    console.log("Correo electrónico enviado. Respuesta del servidor:", info);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Correo enviado exitosamente" }),
    };
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al enviar el correo" }),
    };
  }
};