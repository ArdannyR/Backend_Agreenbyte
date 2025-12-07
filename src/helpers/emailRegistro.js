import nodemailer from 'nodemailer';

const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;

  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.NODE_ENV !== 'production', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // La contraseña de aplicación
    },
  });

  try {
    const info = await transport.sendMail({
      from: '"Agreenbyte - Administrador" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: "Comprueba tu cuenta en Agreenbyte",
      text: "Comprueba tu cuenta en Agreenbyte",
      html: `
        <p>Hola: ${nombre}, comprueba tu cuenta en Agreenbyte.</p>
        <p>Tu cuenta ya está casi lista, solo debes comprobarla en el siguiente enlace:</p>
        
        <a href="${process.env.FRONTEND_URL}/confirmar/${token}">Comprobar Cuenta</a>
        
        <p>Si tú no creaste esta cuenta, puedes ignorar el mensaje.</p>
      `,
    });
    
    console.log("Mensaje enviado: %s", info.messageId);
  } catch (error) {
    console.error("Error enviando email:", error);
  }
};

export default emailRegistro;