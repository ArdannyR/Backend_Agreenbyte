import Agricultor from '../models/Agricultor.js';
import { generarId, generarJWT } from '../helpers/generarToken.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js'; // Puedes reutilizar los mismos helpers o crear nuevos si quieres cambiar el texto del correo

const registrar = async (req, res) => {
  const { nombre, email, password } = req.body;

  // Evitar duplicados
  const existeUsuario = await Agricultor.findOne({ email });
  if (existeUsuario) {
    const error = new Error('Usuario ya registrado');
    return res.status(400).json({ msg: error.message });
  }

  try {
    const agricultor = new Agricultor(req.body);
    // Aunque confirmado sea true por defecto, generamos token por si decides activar confirmación por email a futuro
    agricultor.token = generarId();
    
    await agricultor.save();

    // Opcional: Enviar email de bienvenida o confirmación
    // await emailRegistro({ email: agricultor.email, nombre: agricultor.nombre, token: agricultor.token });

    res.json({ msg: 'Agricultor creado correctamente. Ya puedes iniciar sesión.' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al registrar el agricultor' });
  }
};

const autenticar = async (req, res) => {
  const { email, password } = req.body;

  // Comprobar si el usuario existe
  const usuario = await Agricultor.findOne({ email });
  if (!usuario) {
    const error = new Error('El usuario no existe');
    return res.status(404).json({ msg: error.message });
  }

  // Comprobar si está confirmado
  if (!usuario.confirmado) {
    const error = new Error('Tu cuenta no ha sido confirmada');
    return res.status(403).json({ msg: error.message });
  }

  // Comprobar su password
  if (await usuario.comprobarPassword(password)) {
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      token: generarJWT(usuario._id), // Generamos el token de sesión
    });
  } else {
    const error = new Error('Password incorrecto');
    return res.status(403).json({ msg: error.message });
  }
};

const perfil = (req, res) => {
  // El middleware checkAuth ya colocó al agricultor en req.agricultor
  const { agricultor } = req;
  res.json(agricultor);
};

// --- Funciones de Recuperación de Contraseña (Opcional pero recomendado) ---

const olvidePassword = async (req, res) => {
  const { email } = req.body;
  const usuario = await Agricultor.findOne({ email });
  
  if (!usuario) {
    const error = new Error('El usuario no existe');
    return res.status(404).json({ msg: error.message });
  }

  try {
    usuario.token = generarId();
    await usuario.save();

    // Reutilizamos el helper de email (asegúrate que el link en el email apunte a la ruta correcta del frontend)
    await emailOlvidePassword({
      email: usuario.email,
      nombre: usuario.nombre,
      token: usuario.token
    });

    res.json({ msg: 'Hemos enviado un email con las instrucciones' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Hubo un error' });
  }
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;
  const tokenValido = await Agricultor.findOne({ token });

  if (tokenValido) {
    res.json({ msg: 'Token válido y el usuario existe' });
  } else {
    const error = new Error('Token no válido');
    return res.status(404).json({ msg: error.message });
  }
};

const nuevoPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const usuario = await Agricultor.findOne({ token });

  if (usuario) {
    usuario.password = password;
    usuario.token = '';
    try {
      await usuario.save();
      res.json({ msg: 'Password modificado correctamente' });
    } catch (error) {
      console.log(error);
    }
  } else {
    const error = new Error('Token no válido');
    return res.status(404).json({ msg: error.message });
  }
};

export {
  registrar,
  autenticar,
  perfil,
  olvidePassword,
  comprobarToken,
  nuevoPassword
};