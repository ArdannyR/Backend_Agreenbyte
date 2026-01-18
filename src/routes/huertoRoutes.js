import express from 'express';
import {
  agregarHuerto,
  obtenerHuertos,
  obtenerHuerto,
  actualizarHuerto,
  eliminarHuerto,
  actualizarDatosSensores
} from '../controllers/huertoController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas de huertos requieren autenticación
router.route('/')
  .get(checkAuth, obtenerHuertos)
  .post(checkAuth, agregarHuerto);

router.route('/:id')
  .get(checkAuth, obtenerHuerto)
  .put(checkAuth, actualizarHuerto)
  .delete(checkAuth, eliminarHuerto);

// Ruta de sensores (pública o protegida según tu lógica, aquí se mantiene igual)
router.post('/actualizar-datos', actualizarDatosSensores);

export default router;