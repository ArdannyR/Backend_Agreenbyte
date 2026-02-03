import Agricultor from '../models/Agricultor.js';
import Administrador from '../models/Administrador.js'; 
import Huerto from '../models/Huerto.js';
import { generarId, generarJWT } from '../helpers/generarToken.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js';

const registrar = async (req, res) => {
  const { email } = req.body;

  // 1. Verificar si ya existe como Agricultor
  const existeAgricultor = await Agricultor.findOne({ email });
  if (existeAgricultor) {
    const error = new Error('Usuario ya registrado');
    return res.status(400).json({ msg: error.message });
  }

  // 2. Verificar si ya existe como Administrador (VALIDACIÓN CRUZADA)
  const existeAdmin = await Administrador.findOne({ email });
  if (existeAdmin) {
    const error = new Error('Este correo ya está registrado como Administrador');
    return res.status(400).json({ msg: error.message });
  }

  try {
    const agricultor = new Agricultor(req.body);
    agricultor.token = generarId();
    await agricultor.save();
    res.json({ msg: 'Agricultor creado correctamente', ...agricultor._doc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al registrar el agricultor' });
  }
};

// ... (El resto de las funciones se mantienen igual que en tu última versión: autenticar, perfil, obtenerAgricultores, obtenerMisHuertos, eliminarAgricultor, actualizarPerfil, olvidePassword, comprobarToken, nuevoPassword) ...

const autenticar = async (req, res) => {
  const { email, password } = req.body;
  const usuario = await Agricultor.findOne({ email });
  if (!usuario) {
    const error = new Error('El usuario no existe');
    return res.status(404).json({ msg: error.message });
  }
  if (!usuario.confirmado) {
    const error = new Error('Tu cuenta no ha sido confirmada');
    return res.status(403).json({ msg: error.message });
  }
  if (await usuario.comprobarPassword(password)) {
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      role: 'agricultor', 
      token: generarJWT(usuario._id),
    });
  } else {
    const error = new Error('Password incorrecto');
    return res.status(403).json({ msg: error.message });
  }
};

const perfil = (req, res) => {
  const { agricultor } = req;
  res.json(agricultor);
};

const obtenerAgricultores = async (req, res) => {
    try {
        const agricultores = await Agricultor.find().select('-password -token -confirmado'); 
        res.json(agricultores);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Hubo un error al obtener los agricultores' });
    }
};

const obtenerMisHuertos = async (req, res) => {
    try {
        const huertos = await Huerto.find({ 
            agricultores: req.agricultor._id 
        });
        res.json(huertos);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener huertos' });
    }
}

const eliminarAgricultor = async (req, res) => {
    const { id } = req.params;
    try {
        const agricultor = await Agricultor.findById(id);
        if (!agricultor) {
            return res.status(404).json({ msg: 'Agricultor no encontrado' });
        }
        await Huerto.updateMany(
            { agricultores: id }, 
            { $pull: { agricultores: id } }
        );
        await agricultor.deleteOne();
        res.json({ msg: 'Agricultor eliminado correctamente' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al eliminar agricultor' });
    }
};

const actualizarPerfil = async (req, res) => {
    const agricultor = await Agricultor.findById(req.agricultor._id);
    if (!agricultor) {
        return res.status(404).json({ msg: 'Agricultor no encontrado' });
    }
    const { email } = req.body;
    if (agricultor.email !== req.body.email) {
        const existeEmailAgri = await Agricultor.findOne({ email });
        const existeEmailAdmin = await Administrador.findOne({ email });
        if (existeEmailAgri || existeEmailAdmin) {
            return res.status(400).json({ msg: 'Ese email ya está en uso' });
        }
    }
    agricultor.nombre = req.body.nombre || agricultor.nombre;
    agricultor.email = req.body.email || agricultor.email;
    agricultor.telefono = req.body.telefono || agricultor.telefono;
    agricultor.direccion = req.body.direccion || agricultor.direccion;
    try {
        const agricultorActualizado = await agricultor.save();
        res.json(agricultorActualizado);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Hubo un error al actualizar' });
    }
};

const olvidePassword = async (req, res) => {
  const { email } = req.body;
  const usuario = await Agricultor.findOne({ email });
  if (!usuario) {
    const error = new Error('El usuario no existe');
    return res.status(404).json({ msg: error.message });
  }
  try {
    usuario.token = generarId();
    usuario.tokenExpires = Date.now() + 3600000;
    await usuario.save();
    await emailOlvidePassword({
      email: usuario.email,
      nombre: usuario.nombre,
      token: usuario.token,
      rol: 'agricultor'
    });
    res.json({ msg: 'Hemos enviado un email con las instrucciones' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Hubo un error' });
  }
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;
  const tokenValido = await Agricultor.findOne({ 
      token, 
      tokenExpires: { $gt: Date.now() } 
  });
  if (tokenValido) {
    res.json({ msg: 'Token válido y el usuario existe' });
  } else {
    const error = new Error('Token no válido o expirado');
    return res.status(404).json({ msg: error.message });
  }
};

const nuevoPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const usuario = await Agricultor.findOne({ 
      token, 
      tokenExpires: { $gt: Date.now() } 
  });
  if (usuario) {
    usuario.password = password;
    usuario.token = '';
    usuario.tokenExpires = null;
    try {
      await usuario.save();
      res.json({ msg: 'Password modificado correctamente' });
    } catch (error) {
      console.log(error);
    }
  } else {
    const error = new Error('Token no válido o expirado');
    return res.status(404).json({ msg: error.message });
  }
};

export {
  registrar,
  autenticar,
  perfil,
  olvidePassword,
  comprobarToken,
  nuevoPassword,
  obtenerAgricultores,
  obtenerMisHuertos,
  eliminarAgricultor,
  actualizarPerfil
};