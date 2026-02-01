import express from 'express';
import { addMeasurement, getSensorStats } from '../controllers/sensorController.js';

const router = express.Router();

// Ruta para el ESP32 (Ingesta de datos)
router.post('/data', addMeasurement);

// Ruta para el Frontend (Gráficas)
router.get('/stats/:sensorId', getSensorStats);

export default router;