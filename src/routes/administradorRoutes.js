import express from 'express';
import { check } from 'express-validator'; // Importar check
import { validarCampos } from '../middleware/validarCampos.js';
import { 
  registrar, 
  autenticar, 
  olvidePassword,
  nuevoPassword,
  actualizarPerfil,
  googleLogin
} from '../controllers/administradorController.js';
import checkAuth from '../middleware/authMiddleware.js';

const router = express.Router();

// --- ÁREA PÚBLICA ---

// Registro de Administrador
router.post('/', 
    [
        check('nombre', 'El nombre es obligatorio y no debe estar vacío').not().isEmpty(),
        check('email', 'Agrega un email válido').isEmail(),
        check('password', 'El password debe ser de al menos 6 caracteres').isLength({ min: 6 }),
        validarCampos
    ], 
    registrar
);

// Login Local
router.post('/login', 
    [
        check('email', 'Email no válido').isEmail(),
        check('password', 'El password es obligatorio').not().isEmpty(),
        validarCampos
    ],
    autenticar
);

// Google Login (Validar que el token venga en el body)
router.post('/google-login', 
    [
        check('idToken', 'El token de Google es obligatorio').not().isEmpty(),
        validarCampos
    ],
    googleLogin
);

// Olvidé Password
router.post('/olvide-password', 
    [
        check('email', 'Email no válido').isEmail(),
        validarCampos
    ],
    olvidePassword
);

// Definir nuevo Password
router.post('/olvide-password/:token', 
    [
        check('password', 'El password debe tener al menos 6 caracteres').isLength({ min: 6 }),
        validarCampos
    ],
    nuevoPassword
);

// --- ÁREA PRIVADA ---

// Actualizar Perfil
router.put('/perfil', 
    checkAuth, 
    [
        check('nombre', 'El nombre no puede ir vacío').optional().not().isEmpty(),
        check('email', 'Formato de email incorrecto').optional().isEmail(),
        validarCampos
    ],
    actualizarPerfil
);

export default router;