import express from 'express';
import { crearSesionPago } from '../controllers/pagoController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/crear-sesion', checkAuth, crearSesionPago);

export default router;