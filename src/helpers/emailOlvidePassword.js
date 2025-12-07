import nodemailer from 'nodemailer';

const emailOlvidePassword = async (datos) => {
  const { email, nombre, token } = datos;

  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.NODE_ENV !== 'production', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transport.sendMail({
      from: '"Agreenbyte - Administrador" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: "Agreenbyte - Reestablece tu Password",
      text: "Reestablece tu Password",
      html: `
        <p>Hola: ${nombre}, has solicitado reestablecer tu password.</p>
        <p>Sigue el siguiente enlace para generar un nuevo password:</p>
        
        <a href="${process.env.FRONTEND_URL}/olvide-password/${token}">Reestablecer Password</a>
        
        <p>Si tú no solicitaste este email, puedes ignorar el mensaje.</p>
      `,
    });
    
    console.log("Mensaje enviado: %s", info.messageId);
  } catch (error) {
    console.error("Error enviando email:", error);
  }
};

export default emailOlvidePassword;