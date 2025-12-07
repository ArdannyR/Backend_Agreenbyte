import mongoose from 'mongoose';

const conectarDB = async () => {
  try {
    const dbUri = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PRODUCTION 
      : process.env.MONGODB_URI_LOCAL;

    if (!dbUri) {
      throw new Error("No se ha definido la URI de la base de datos en el .env");
    }

    const db = await mongoose.connect(dbUri);
    
    const url = `${db.connection.host}:${db.connection.port}`;
    console.log(`MongoDB conectado en: ${url}`);
  } catch (error) {
    console.log(`error: ${error.message}`);
    process.exit(1);
  }
};

export default conectarDB;