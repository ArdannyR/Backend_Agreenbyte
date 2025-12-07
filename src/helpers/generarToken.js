import jwt from 'jsonwebtoken';

// Genera un token aleatorio simple (para confirmación de cuenta)
const generarId = () => {
  return Math.random().toString(32).substring(2) + Date.now().toString(32);
};

// Genera un JSON Web Token (para autenticación)
const generarJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // El token expira en 30 días
  });
};

export { generarId, generarJWT };