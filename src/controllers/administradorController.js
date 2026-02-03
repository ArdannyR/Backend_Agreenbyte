import Administrador from '../models/Administrador.js'; 
import Agricultor from '../models/Agricultor.js'; // Importar modelo Agricultor
import { generarId, generarJWT } from '../helpers/generarToken.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
    const { idToken } = req.body; 

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });
        
        const payload = ticket.getPayload();
        const { email, name } = payload;

        // Validar que no sea un agricultor
        const existeAgricultor = await Agricultor.findOne({ email });
        if (existeAgricultor) {
            return res.status(400).json({ msg: 'Este correo ya está registrado como Agricultor.' });
        }

        let usuario = await Administrador.findOne({ email });

        if (!usuario) {
            usuario = new Administrador({
                nombre: name,
                email: email,
                password: ':)', 
                confirmado: true,
                google: true
            });
            await usuario.save();
        } else {
            usuario.google = true;
            usuario.confirmado = true;
            await usuario.save();
        }

        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: generarJWT(usuario._id), 
        });

    } catch (error) {
        console.error("Error al verificar token de Google:", error);
        res.status(403).json({ msg: "Token de Google no válido" });
    }
};

const registrar = async (req, res) => {
  const { nombre, email, password } = req.body;

  // 1. Verificar si ya existe como Administrador
  const existeAdmin = await Administrador.findOne({ email });
  if (existeAdmin) {
    const error = new Error('Email ya registrado como Administrador.');
    return res.status(400).json({ msg: error.message });
  }

  // 2. Verificar si ya existe como Agricultor (VALIDACIÓN CRUZADA)
  const existeAgricultor = await Agricultor.findOne({ email });
  if (existeAgricultor) {
    const error = new Error('Este email ya pertenece a un Agricultor.');
    return res.status(400).json({ msg: error.message });
  }

  try {
    const administrador = new Administrador(req.body);
    administrador.token = generarId();
    await administrador.save();

    try {
        await emailRegistro({
          email: administrador.email,
          nombre: administrador.nombre,
          token: administrador.token
        });
    } catch (errorEmail) {
        console.log("Error enviando el email: ", errorEmail);
    }

    res.json({ msg: 'Usuario creado Correctamente, revisa tu email para confirmar tu cuenta', token: administrador.token});

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al registrar' });
  }
};

// ... resto de funciones (confirmarCuenta, autenticar, perfil, olvidePassword, etc.) ...
// Asegúrate de copiar el resto del archivo original o usar el que ya tenías, solo cambiamos registrar y googleLogin

const confirmarCuenta = async (req, res) => {
  const { token } = req.params;
  const usuarioConfirmar = await Administrador.findOne({ token });

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

  const usuario = await Administrador.findOne({ email });
  if (!usuario) {
    const error = new Error('El usuario no existe.');
    return res.status(404).json({ msg: error.message });
  }

  if (usuario.google && password !== ':)') { 
      // Opcional: Avisar si intenta entrar con password normal
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
  const { administrador } = req;
  res.json(administrador);
};

const olvidePassword = async (req, res) => {
  const { email } = req.body;
  const usuario = await Administrador.findOne({ email });
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
    await usuario.save();

    await emailOlvidePassword({
      email: usuario.email,
      nombre: usuario.nombre,
      token: usuario.token,
      rol: 'admin' // Importante para el email correcto
    });

    res.json({ msg: 'Hemos enviado un email con las instrucciones.', token: usuario.token});

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;
  const usuario = await Administrador.findOne({ token, tokenExpires: { $gt: Date.now() } });

  if (!usuario) {
    const error = new Error('Token no válido o expirado.');
    return res.status(404).json({ msg: error.message });
  }

  res.json({ msg: 'Token válido. Introduce tu nueva contraseña.' });
};

const nuevoPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body; 
  const usuario = await Administrador.findOne({ token, tokenExpires: { $gt: Date.now() } });

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
  const administrador = req.administrador; 
  const { nombre, email, apellido, telefono, direccion } = req.body;

  if (email && email !== administrador.email) {
    const existeEmailAdmin = await Administrador.findOne({ email });
    const existeEmailAgri = await Agricultor.findOne({ email });
    
    if (existeEmailAdmin || existeEmailAgri) {
      return res.status(400).json({ msg: 'Ese email ya está registrado' });
    }
  }

  administrador.nombre = nombre || administrador.nombre;
  administrador.email = email || administrador.email;
  // Campos extra
  if (apellido) administrador.apellido = apellido;
  if (telefono) administrador.telefono = telefono;
  if (direccion) administrador.direccion = direccion;

  try {
    const administradorActualizado = await administrador.save();
    res.json(administradorActualizado);
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
  actualizarPerfil,
  googleLogin       
};