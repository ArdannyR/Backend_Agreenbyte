import express from 'express';
import { addMeasurement, getSensorStats, registrarSensor } from '../controllers/sensorController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para el ESP32 (Ingesta de datos)
router.post('/', checkAuth, registrarSensor);

// Ruta para el Frontend (Gráficas)
router.post('/data', addMeasurement);
router.get('/stats/:sensorId', getSensorStats);

export default router;