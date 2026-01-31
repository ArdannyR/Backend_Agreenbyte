import express from 'express';
import {
  agregarHuerto,
  obtenerHuertos,
  obtenerHuerto,
  actualizarHuerto,
  eliminarHuerto,
  actualizarDatosSensores,
  agregarAgricultor
} from '../controllers/huertoController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// Área Privada (Requieren Autenticación)
router.get('/', checkAuth, obtenerHuertos);
router.post('/', checkAuth, agregarHuerto);

router.get('/:id', checkAuth, obtenerHuerto);
router.put('/:id', checkAuth, actualizarHuerto);
router.delete('/:id', checkAuth, eliminarHuerto);

router.post('/agricultor/:id', checkAuth, agregarAgricultor);

// Área Pública (O de Sensores)
router.post('/actualizar-datos', actualizarDatosSensores);

export default router;