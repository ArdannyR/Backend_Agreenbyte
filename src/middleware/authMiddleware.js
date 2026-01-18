import jwt from 'jsonwebtoken';
import Desarrollador from '../models/Desarrollador.js';
import Agricultor from '../models/Agricultor.js';

const checkAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 1. Intentar buscar en Desarrolladores
      const desarrollador = await Desarrollador.findById(decoded.id).select('-password -token -confirmado');
      
      if (desarrollador) {
        req.desarrollador = desarrollador;
        return next();
      }

      // 2. Si no es desarrollador, buscar en Agricultores
      const agricultor = await Agricultor.findById(decoded.id).select('-password');
      
      if (agricultor) {
        req.agricultor = agricultor;
        return next();
      }

      // Si no encuentra ninguno
      return res.status(404).json({ msg: 'Usuario no encontrado' });

    } catch (error) {
      return res.status(401).json({ msg: 'Token no válido' });
    }
  }

  if (!token) {
    const error = new Error('Token no enviado');
    return res.status(401).json({ msg: error.message });
  }

  next();
};

export default checkAuth;