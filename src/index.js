import express from 'express';
import conectarDB from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

// Importación de rutas
import administradorRoutes from './routes/administradorRoutes.js'; 
import huertoRoutes from './routes/huertoRoutes.js';
import agricultorRoutes from './routes/agricultorRoutes.js';
import sensorRoutes from './routes/sensorRoutes.js'; // <--- NUEVO: Importamos rutas de sensores

// Configura dotenv para cargar variables de entorno
dotenv.config();

// Configuración de URL del frontend según el entorno
if (process.env.NODE_ENV === 'production') {
    process.env.FRONTEND_URL = process.env.URL_FRONTEND_URL;
} else {
    process.env.FRONTEND_URL = process.env.URL_FRONTEND_LOCAL;
}

// Conectar a la base de datos
conectarDB(); 

// Crear la instancia de express
const app = express();

// Crear el servidor HTTP a partir de la app de Express
const server = http.createServer(app);

// Configurar Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*", // Permitimos el origen del frontend
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware Mágico: Compartir 'io' con los controladores
// Esto permite que sensorController.js emita eventos aunque esté en otro archivo
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Habilitar CORS (para las peticiones HTTP normales)
app.use(cors());

// Habilitar lectura de JSON
app.use(express.json());

// Definir el puerto
const PORT = process.env.PORT || 4000;

// --- DEFINICIÓN DE RUTAS ---
app.use('/api/administradores', administradorRoutes); 
app.use('/api/huertos', huertoRoutes); 
app.use('/api/agricultores', agricultorRoutes);
app.use('/api/sensores', sensorRoutes); // <--- NUEVO: Endpoint base para IoT

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend Agreenbyte funcionando con WebSockets y TimeSeries 🚀');
});

// Eventos de conexión de Socket.io (Para ver en consola quién entra)
io.on('connection', (socket) => {
    console.log(`⚡ Cliente conectado al socket: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
});

// Arrancar el servidor
// IMPORTANTE: Usamos server.listen en lugar de app.listen
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});