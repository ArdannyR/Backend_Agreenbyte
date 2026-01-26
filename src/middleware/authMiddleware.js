import jwt from 'jsonwebtoken';
import Administrador from '../models/Administrador.js'; 
import Agricultor from '../models/Agricultor.js';

const checkAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const administrador = await Administrador.findById(decoded.id).select('-password -token -confirmado');
      
      if (administrador) {
        req.administrador = administrador; 
        return next();
      }
      const agricultor = await Agricultor.findById(decoded.id).select('-password');
      
      if (agricultor) {
        req.agricultor = agricultor;
        return next();
      }

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