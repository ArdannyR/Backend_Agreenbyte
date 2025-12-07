import nodemailer from 'nodemailer';

export const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;

  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Información del email
  const info = await transport.sendMail({
    from: '"Greenhouse A1 - Administrador de Huertos" <cuentas@greenhousea1.com>',
    to: email,
    subject: "Greenhouse A1 - Confirma tu cuenta",
    text: "Comprueba tu cuenta en Greenhouse A1",
    html: `
      <p>Hola: ${nombre}, has creado tu cuenta en Greenhouse A1.</p>
      <p>Tu cuenta ya está casi lista, solo debes comprobarla en el siguiente enlace:</p>
      
      <a href="${process.env.FRONTEND_URL}/confirmar/${token}">Comprobar Cuenta</a>
      
      <p>Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>
    `
  });

  console.log("Mensaje enviado: %s", info.messageId);
};

export const emailOlvidePassword = async (datos) => {
  const { email, nombre, token } = datos;

  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Información del email
  const info = await transport.sendMail({
    from: '"Greenhouse A1 - Administrador de Huertos" <cuentas@greenhousea1.com>',
    to: email,
    subject: "Greenhouse A1 - Reestablece tu Password",
    text: "Reestablece tu Password",
    html: `
      <p>Hola: ${nombre}, has solicitado reestablecer tu password.</p>
      <p>Sigue el siguiente enlace para generar un nuevo password:</p>
      
      <a href="${process.env.FRONTEND_URL}/olvide-password/${token}">Reestablecer Password</a>
      
      <p>Si tú no solicitaste este email, puedes ignorar este mensaje.</p>
    `
  });

  console.log("Mensaje enviado: %s", info.messageId);
};