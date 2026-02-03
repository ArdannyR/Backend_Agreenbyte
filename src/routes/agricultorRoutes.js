import express from 'express';
import {
  registrar,
  autenticar,
  perfil,
  obtenerAgricultores,
  obtenerMisHuertos,
  eliminarAgricultor,
  actualizarPerfil,
  olvidePassword, 
  comprobarToken, 
  nuevoPassword   
} from '../controllers/agricultorController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// Área Pública
router.post('/', registrar);
router.post('/login', autenticar);

// --- Rutas de Recuperación de Contraseña ---
router.post('/olvide-password', olvidePassword);
router.route('/olvide-password/:token').get(comprobarToken).post(nuevoPassword);

// Área Privada
router.route('/perfil')
    .get(checkAuth, perfil)
    .put(checkAuth, actualizarPerfil);

router.get('/', checkAuth, obtenerAgricultores);
router.get('/mis-huertos', checkAuth, obtenerMisHuertos);
router.delete('/:id', checkAuth, eliminarAgricultor); 

export default router;