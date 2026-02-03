import express from 'express';
import { 
  registrar, 
  confirmarCuenta, 
  autenticar, 
  perfil,
  olvidePassword,
  comprobarToken,
  nuevoPassword,
  actualizarPerfil,
  googleLogin
} from '../controllers/administradorController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Endpoints ---
// Área Pública
router.post('/', registrar); 
router.get('/confirmar/:token', confirmarCuenta);
router.post('/login', autenticar);
router.post('/google-login', googleLogin);

// Area de recuperación de contraseña
router.post('/olvide-password', olvidePassword); 
router.get('/olvide-password/:token', comprobarToken);
router.post('/olvide-password/:token', nuevoPassword); 

// Área Privada (Requiere autenticación)
router.route('/perfil')
    .get(checkAuth, perfil)
    .put(checkAuth, actualizarPerfil); 

export default router;