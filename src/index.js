import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import conectarDB from './config/db.js';
// CAMBIO: Importamos las nuevas rutas
import desarrolladorRoutes from './routes/desarrolladorRoutes.js'
import huertoRoutes from './routes/huertoRoutes.js';

// Configura dotenv para cargar variables de entorno
dotenv.config();

if (process.env.NODE_ENV === 'production') {
    process.env.FRONTEND_URL = process.env.URL_FRONTEND_PROD;
} else {
    process.env.FRONTEND_URL = process.env.URL_FRONTEND_LOCAL;
}

// Conectar a la base de datos
conectarDB(); 

// Crear la instancia de express
const app = express();

// Habilitar CORS (para que tu frontend se conecte)
app.use(cors());

// Habilitar lectura de JSON
app.use(express.json());

// Definir el puerto
const PORT = process.env.PORT || 4000;

// CAMBIO: Usamos el nuevo endpoint base
app.use('/api/desarrolladores', desarrolladorRoutes);
app.use('/api/huertos', huertoRoutes); 

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola Mundo! El backend del Desarrollador está funcionando.');
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});