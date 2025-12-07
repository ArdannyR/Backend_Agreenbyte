import jwt from 'jsonwebtoken';
import Agricultor from '../models/Agricultor.js';

const checkAuth = async (req, res, next) => {
  let token;

  // 1. Revisar si el token se envía en los headers (formato Bearer)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extraer el token
      token = req.headers.authorization.split(' ')[1];

      // 3. Verificar el token con la clave secreta
      // (Asegúrate de tener JWT_SECRET en tu archivo .env)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Buscar al usuario en la BD con el ID del token
      // y adjuntarlo a la petición (req)
      req.agricultor = await Agricultor.findById(decoded.id).select(
        '-password -confirmado -token' // Excluimos campos sensibles
      );

      if (!req.agricultor) {
        return res.status(401).json({ msg: 'Token no válido (usuario no encontrado)' });
      }

      // 5. Si todo está bien, pasar al siguiente middleware o controlador
      return next();

    } catch (error) {
      // Si el token es inválido o expiró
      return res.status(401).json({ msg: 'Token no válido o expirado' });
    }
  }

  // Si no se envía ningún token
  if (!token) {
    const error = new Error('Token no enviado');
    return res.status(401).json({ msg: error.message });
  }

  next();
};

export default checkAuth;