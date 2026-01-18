import express from 'express';
import {
  registrar,
  autenticar,
  perfil,
  olvidePassword,
  comprobarToken,
  nuevoPassword
} from '../controllers/agricultorController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// Área Pública
router.post('/', registrar); // Registro de nuevos agricultores
router.post('/login', autenticar); // Login
router.post('/olvide-password', olvidePassword);
router.route('/olvide-password/:token').get(comprobarToken).post(nuevoPassword);

// Área Privada
router.get('/perfil', checkAuth, perfil);

export default router;