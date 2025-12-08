import Agricultor from '../models/Agricultor.js';
import { generarId, generarJWT } from '../helpers/generarToken.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js';

const registrar = async (req, res) => {
  const { nombre, email, password } = req.body;

  const existeUsuario = await Agricultor.findOne({ email });

  if (existeUsuario) {
    const error = new Error('Email ya registrado. Intenta con otro.');
    return res.status(400).json({ msg: error.message });
  }

  try {
    const agricultor = new Agricultor(req.body);
    agricultor.token = generarId();
    
    await agricultor.save();

    // --- Enviar el email ---
    try {
        await emailRegistro({
          email: agricultor.email,
          nombre: agricultor.nombre,
          token: agricultor.token
        });
    } catch (errorEmail) {
        console.log("Error enviando el email: ", errorEmail);
    }

    res.json({ msg: 'Usuario creado Correctamente, revisa tu email para confirmar tu cuenta', token: agricultor.token});

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al registrar' });
  }
};

const confirmarCuenta = async (req, res) => {
  // 1. Obtener el token de la URL
  const { token } = req.params;

  // 2. Buscar al usuario con ese token
  const usuarioConfirmar = await Agricultor.findOne({ token });

  if (!usuarioConfirmar) {
    const error = new Error('Token no válido o la cuenta ya fue confirmada.');
    return res.status(404).json({ msg: error.message });
  }

  // 3. Si existe, confirmar la cuenta y limpiar el token
  try {
    usuarioConfirmar.confirmado = true;
    usuarioConfirmar.token = ''; // El token es de un solo uso
    await usuarioConfirmar.save();

    res.json({ msg: 'Cuenta confirmada correctamente.' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error en el servidor al confirmar la cuenta.' });
  }
};

const autenticar = async (req, res) => {
  // 1. Obtener datos del formulario
  const { email, password } = req.body;

  // 2. Comprobar si el usuario existe
  const usuario = await Agricultor.findOne({ email });
  if (!usuario) {
    const error = new Error('El usuario no existe.');
    return res.status(404).json({ msg: error.message });
  }

  // 3. Comprobar si está confirmado (¡Importante!)
  if (!usuario.confirmado) {
    const error = new Error('Tu cuenta no ha sido confirmada.');
    return res.status(403).json({ msg: error.message });
  }

  // 4. Comprobar el password
  if (await usuario.comprobarPassword(password)) {
    // 5. Si es correcto, generar el JWT y enviarlo
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      token: generarJWT(usuario._id), // ¡Aquí se genera el JWT!
    });
  } else {
    const error = new Error('Password incorrecto.');
    return res.status(403).json({ msg: error.message });
  }
};

const perfil = (req, res) => {
  // El middleware 'checkAuth' ya hizo la validación y adjuntó el usuario en req.agricultor
  const { agricultor } = req;
  
  // Simplemente devolvemos los datos del perfil
  res.json(agricultor);
};

const olvidePassword = async (req, res) => {
  const { email } = req.body;

  const usuario = await Agricultor.findOne({ email });
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

  // 1. Buscar al usuario por el token Y verificar que no haya expirado
  const usuario = await Agricultor.findOne({
    token,
    tokenExpires: { $gt: Date.now() }, // $gt = greater than (mayor que)
  });

  if (!usuario) {
    const error = new Error('Token no válido o expirado.');
    return res.status(404).json({ msg: error.message });
  }

  // 2. Si es válido, respondemos OK.
  // El frontend usará esta respuesta para mostrar el formulario de nueva contraseña.
  res.json({ msg: 'Token válido. Introduce tu nueva contraseña.' });
};

const nuevoPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body; // El nuevo password

  // 1. Validar que el token sigue siendo válido
  const usuario = await Agricultor.findOne({
    token,
    tokenExpires: { $gt: Date.now() },
  });

  if (!usuario) {
    const error = new Error('Token no válido o expirado.');
    return res.status(404).json({ msg: error.message });
  }

  // 2. Validar que se envió un password
  if (!password || password.length < 6) {
    const error = new Error('El password debe tener al menos 6 caracteres.');
    return res.status(400).json({ msg: error.message });
  }

  try {
    // 3. Guardar el nuevo password.
    // El 'pre-save' hook de tu modelo Agricultor.js se encargará de hashearlo.
    usuario.password = password;

    // 4. Limpiar/invalidar el token para que no se reutilice
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
  const agricultor = req.agricultor; 
  
  // Extraemos TODO lo que venga del body
  const { nombre, email, apellido, telefono, direccion } = req.body;

  if (email && email !== agricultor.email) {
    const existeEmail = await Agricultor.findOne({ email });
    if (existeEmail) {
      return res.status(400).json({ msg: 'Ese email ya está registrado' });
    }
  }

  // Actualizamos los campos (si no vienen, mantenemos el anterior)
  agricultor.nombre = nombre || agricultor.nombre;
  agricultor.email = email || agricultor.email;
  
  agricultor.apellido = apellido || agricultor.apellido;
  agricultor.telefono = telefono || agricultor.telefono;
  agricultor.direccion = direccion || agricultor.direccion;

  try {
    const agricultorActualizado = await agricultor.save();
    res.json(agricultorActualizado);
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