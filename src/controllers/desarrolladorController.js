import Desarrollador from '../models/Desarrollador.js';
import { generarId, generarJWT } from '../helpers/generarToken.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js';

const registrar = async (req, res) => {
  const { nombre, email, password } = req.body;

  const existeUsuario = await Desarrollador.findOne({ email });

  if (existeUsuario) {
    const error = new Error('Email ya registrado. Intenta con otro.');
    return res.status(400).json({ msg: error.message });
  }

  try {
    const desarrollador = new Desarrollador(req.body);
    desarrollador.token = generarId();
    
    await desarrollador.save();

    // --- Enviar el email ---
    try {
        await emailRegistro({
          email: desarrollador.email,
          nombre: desarrollador.nombre,
          token: desarrollador.token
        });
    } catch (errorEmail) {
        console.log("Error enviando el email: ", errorEmail);
    }

    res.json({ msg: 'Usuario creado Correctamente, revisa tu email para confirmar tu cuenta', token: desarrollador.token});

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al registrar' });
  }
};

const confirmarCuenta = async (req, res) => {
  const { token } = req.params;

  const usuarioConfirmar = await Desarrollador.findOne({ token });

  if (!usuarioConfirmar) {
    const error = new Error('Token no válido o la cuenta ya fue confirmada.');
    return res.status(404).json({ msg: error.message });
  }

  try {
    usuarioConfirmar.confirmado = true;
    usuarioConfirmar.token = ''; 
    await usuarioConfirmar.save();

    res.json({ msg: 'Cuenta confirmada correctamente.' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor al confirmar la cuenta.' });
  }
};

const autenticar = async (req, res) => {
  const { email, password } = req.body;

  const usuario = await Desarrollador.findOne({ email });
  if (!usuario) {
    const error = new Error('El usuario no existe.');
    return res.status(404).json({ msg: error.message });
  }

  if (!usuario.confirmado) {
    const error = new Error('Tu cuenta no ha sido confirmada.');
    return res.status(403).json({ msg: error.message });
  }

  if (await usuario.comprobarPassword(password)) {
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      token: generarJWT(usuario._id), 
    });
  } else {
    const error = new Error('Password incorrecto.');
    return res.status(403).json({ msg: error.message });
  }
};

const perfil = (req, res) => {
  // El middleware 'checkAuth' adjuntará 'desarrollador' en lugar de 'agricultor'
  const { desarrollador } = req;
  res.json(desarrollador);
};

const olvidePassword = async (req, res) => {
  const { email } = req.body;

  const usuario = await Desarrollador.findOne({ email });
  if (!usuario) {
    const error = new Error('El usuario no existe.');
    return res.status(404).json({ msg: error.message });
  }

  if (!usuario.confirmado) {
    const error = new Error('La cuenta no ha sido confirmada.');
    return res.status(403).json({ msg: error.message });
  }

  try {
    usuario.token = generarId();
    usuario.tokenExpires = Date.now() + 3600000; 
    console.log("TOKEN GENERADO:", usuario.token);
    await usuario.save();

    await emailOlvidePassword({
      email: usuario.email,
      nombre: usuario.nombre,
      token: usuario.token
    });

    res.json({ msg: 'Hemos enviado un email con las instrucciones.' , token: usuario.token});

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;

  const usuario = await Desarrollador.findOne({
    token,
    tokenExpires: { $gt: Date.now() }, 
  });

  if (!usuario) {
    const error = new Error('Token no válido o expirado.');
    return res.status(404).json({ msg: error.message });
  }

  res.json({ msg: 'Token válido. Introduce tu nueva contraseña.' });
};

const nuevoPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body; 

  const usuario = await Desarrollador.findOne({
    token,
    tokenExpires: { $gt: Date.now() },
  });

  if (!usuario) {
    const error = new Error('Token no válido o expirado.');
    return res.status(404).json({ msg: error.message });
  }

  if (!password || password.length < 6) {
    const error = new Error('El password debe tener al menos 6 caracteres.');
    return res.status(400).json({ msg: error.message });
  }

  try {
    usuario.password = password;
    usuario.token = '';
    usuario.tokenExpires = null;

    await usuario.save();
    res.json({ msg: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al actualizar la contraseña.' });
  }
};

const actualizarPerfil = async (req, res) => {
  const desarrollador = req.desarrollador; 
  
  const { nombre, email, apellido, telefono, direccion } = req.body;

  if (email && email !== desarrollador.email) {
    const existeEmail = await Desarrollador.findOne({ email });
    if (existeEmail) {
      return res.status(400).json({ msg: 'Ese email ya está registrado' });
    }
  }

  desarrollador.nombre = nombre || desarrollador.nombre;
  desarrollador.email = email || desarrollador.email;
  desarrollador.apellido = apellido || desarrollador.apellido;
  desarrollador.telefono = telefono || desarrollador.telefono;
  desarrollador.direccion = direccion || desarrollador.direccion;

  try {
    const desarrolladorActualizado = await desarrollador.save();
    res.json(desarrolladorActualizado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Hubo un error al actualizar el perfil' });
  }
};

export { 
  registrar,
  confirmarCuenta, 
  autenticar,      
  perfil,
  olvidePassword,
  comprobarToken,
  nuevoPassword,
  actualizarPerfil        
};