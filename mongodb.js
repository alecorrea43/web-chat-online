// mongodb.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoDBURL = process.env.MONGODB_URL;

    await mongoose.connect(mongoDBURL, {
  
    });

    console.log('Conexión a MongoDB establecida correctamente');
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
