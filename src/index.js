import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import conectarDB from './config/db.js';

// Importación de rutas
import desarrolladorRoutes from './routes/desarrolladorRoutes.js';
import huertoRoutes from './routes/huertoRoutes.js';
import agricultorRoutes from './routes/agricultorRoutes.js'; // [NUEVO] Importamos rutas de agricultores

// Configura dotenv para cargar variables de entorno
dotenv.config();

// Configuración de URL del frontend según el entorno
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

// --- DEFINICIÓN DE RUTAS ---
app.use('/api/desarrolladores', desarrolladorRoutes);
app.use('/api/huertos', huertoRoutes); 
app.use('/api/agricultores', agricultorRoutes); // [NUEVO] Endpoint para agricultores

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola Mundo! El backend de Agreenbyte está funcionando correctamente.');
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});