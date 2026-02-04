import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import conectarDB from './config/db.js';
import administradorRoutes from './routes/administradorRoutes.js';
import agricultorRoutes from './routes/agricultorRoutes.js';
import huertoRoutes from './routes/huertoRoutes.js';
import pagoRoutes from './routes/pagoRoutes.js'; // Nueva ruta de pagos
import sensorRoutes from './routes/sensorRoutes.js';

// Importaciones para Socket.io
import http from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(express.json());

dotenv.config();

conectarDB();

const dominiosPermitidos = [process.env.URL_FRONTEND_LOCAL, process.env.URL_FRONTEND_PROD];

const corsOptions = {
    origin: function (origin, callback) {
        if (dominiosPermitidos.indexOf(origin) !== -1 || !origin) { // !origin permite postman/mobile apps
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
};

app.use(cors(corsOptions));

// === CONFIGURACIÓN SOCKET.IO ===
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL, // Debe coincidir con tu frontend (ej: http://localhost:5173)
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    // console.log("Cliente conectado a Socket.io:", socket.id);
    
    // Aquí puedes añadir lógica de salas si quisieras privacidad por huerto
    // socket.on('join_room', (huertoId) => socket.join(huertoId));
    
    socket.on("disconnect", () => {
        // console.log("Cliente desconectado");
    });
});

// Middleware para disponibilizar 'io' en los controladores
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Rutas
app.use('/api/administradores', administradorRoutes);
app.use('/api/agricultores', agricultorRoutes);
app.use('/api/huertos', huertoRoutes);
app.use('/api/pagos', pagoRoutes); // Usar la ruta de pagos
app.use('/api/sensor', sensorRoutes);

const PORT = process.env.PORT || 4000;

// IMPORTANTE: Cambiamos app.listen por server.listen
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});