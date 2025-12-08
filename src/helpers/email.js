import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURACIÓN DE TRANSPORTERS ---

// 1. Principal: BREVO
const transportBrevo = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false, 
  auth: {
    user: process.env.BREVO_USER, 
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// 2. Respaldo: GMAIL
const transportGmail = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- FUNCIÓN DE ENVÍO HÍBRIDO (La magia ocurre aquí) ---
const enviarCorreoHibrido = async (opcionesEmail) => {
  try {
    // Intento 1: Brevo
    console.log("🚀 Intentando enviar con Brevo...");
    const info = await transportBrevo.sendMail(opcionesEmail);
    console.log("✅ Correo enviado con Brevo ID:", info.messageId);
    return info;

  } catch (error) {
    console.error("⚠️ Falló Brevo:", error.message);
    console.log("🔄 Cambiando a servidor de respaldo (Gmail)...");

    try {
      // Intento 2: Gmail (Respaldo)
      // Nota: Gmail sobreescribirá el 'from' con tu correo real de Gmail
      const infoBackup = await transportGmail.sendMail(opcionesEmail);
      console.log("✅ Correo enviado con Gmail (Respaldo) ID:", infoBackup.messageId);
      return infoBackup;

    } catch (errorBackup) {
      console.error("❌ Fallaron ambos servidores de correo.");
      throw new Error("No se pudo enviar el email por ningún medio.");
    }
  }
};

// --- EXPORTACIONES ---

export const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;

  await enviarCorreoHibrido({
    from: '"Agreenbyte - Administrador" <avproject049@gmail.com>',
    to: email,
    subject: "Agreenbyte - Comprueba tu cuenta",
    text: "Comprueba tu cuenta en Agreenbyte",
    html: `
      <p>Hola: ${nombre}, has creado tu cuenta en Agreenbyte.</p>
      <p>Tu cuenta ya está casi lista, solo debes comprobarla en el siguiente enlace:</p>
      <a href="${process.env.FRONTEND_URL}/confirmar/${token}">Comprobar Cuenta</a>
      <p>Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>
    `
  });
};

export const emailOlvidePassword = async (datos) => {
  const { email, nombre, token } = datos;

  await enviarCorreoHibrido({
    from: '"Agreenbyte - Administrador" <avproject049@gmail.com>',
    to: email,
    subject: "Agreenbyte - Reestablece tu Password",
    text: "Reestablece tu Password",
    html: `
      <p>Hola: ${nombre}, has solicitado reestablecer tu password.</p>
      <p>Sigue el siguiente enlace para generar un nuevo password:</p>
      <a href="${process.env.FRONTEND_URL}/olvide-password/${token}">Reestablecer Password</a>
      <p>Si tú no solicitaste este email, puedes ignorar este mensaje.</p>
    `
  });
};