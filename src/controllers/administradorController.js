import Administrador from '../models/Administrador.js'; 
import { generarId, generarJWT } from '../helpers/generarToken.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
    const { idToken } = req.body; // El token que viene del frontend

    try {
        // 1. Verificar el token con Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        // 2. Buscar si el usuario ya existe en tu DB
        let usuario = await Administrador.findOne({ email });

        if (!usuario) {
            // Si no existe, puedes crearlo automáticamente (Registro con Google)
            usuario = new Administrador({
                nombre: name,
                email: email,
                password: ':)', // Password dummy ya que usa Google
                confirmado: true // Al venir de Google, el email ya está verificado
            });
            await usuario.save();
        }

        // 3. Generar tu propio JWT para que el usuario siga navegando en tu App
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

  const existeUsuario = await Administrador.findOne({ email }); // [CAMBIO]

  if (existeUsuario) {
    const error = new Error('Email ya registrado. Intenta con otro.');
    return res.status(400).json({ msg: error.message });
  }

  try {
    // [CAMBIO] Variable y new Administrador
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

const confirmarCuenta = async (req, res) => {
  const { token } = req.params;

  const usuarioConfirmar = await Administrador.findOne({ token }); // [CAMBIO]

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

  const usuario = await Administrador.findOne({ email }); // [CAMBIO]
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
  const { administrador } = req;
  res.json(administrador);
};

const olvidePassword = async (req, res) => {
  const { email } = req.body;

  const usuario = await Administrador.findOne({ email }); // [CAMBIO]
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

  const usuario = await Administrador.findOne({ // [CAMBIO]
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

  const usuario = await Administrador.findOne({ // [CAMBIO]
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
  const administrador = req.administrador; 
  
  const { nombre, email, apellido, telefono, direccion } = req.body;

  if (email && email !== administrador.email) {
    const existeEmail = await Administrador.findOne({ email }); // [CAMBIO]
    if (existeEmail) {
      return res.status(400).json({ msg: 'Ese email ya está registrado' });
    }
  }

  administrador.nombre = nombre || administrador.nombre;
  administrador.email = email || administrador.email;
  administrador.apellido = apellido || administrador.apellido;
  administrador.telefono = telefono || administrador.telefono;
  administrador.direccion = direccion || administrador.direccion;

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