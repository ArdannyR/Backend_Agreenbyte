import express from 'express';
import {
  agregarHuerto,
  obtenerHuertos,
  obtenerHuerto,
  actualizarHuerto,
  eliminarHuerto,
  agregarAgricultor
} from '../controllers/huertoController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// Obtener todos los huertos y Crear uno nuevo
router.get('/', checkAuth, obtenerHuertos);
router.post('/', checkAuth, agregarHuerto);

// Operaciones sobre un huerto específico
router.get('/:id', checkAuth, obtenerHuerto);
router.put('/:id', checkAuth, actualizarHuerto);
router.delete('/:id', checkAuth, eliminarHuerto);

// Agregar agricultor a un huerto
router.post('/agricultor/:id', checkAuth, agregarAgricultor);

export default router;