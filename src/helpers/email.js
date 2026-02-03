import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURACIÓN DE TRANSPORTERS ---

// Configuración optimizada para timeouts
const mailConfig = {
    connectionTimeout: 10000, // 10 segundos para conectar
    greetingTimeout: 10000,   // 10 segundos para saludo
    socketTimeout: 10000,     // 10 segundos para socket
};

// 1. Principal: BREVO
const transportBrevo = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS explícito
  auth: {
    user: process.env.BREVO_USER, 
    pass: process.env.BREVO_SMTP_KEY,
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  ...mailConfig
});

// 2. Respaldo: GMAIL
const transportGmail = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL implícito
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  ...mailConfig
});

// --- FUNCIÓN DE ENVÍO HÍBRIDO ---
const enviarCorreoHibrido = async (opcionesEmail) => {
  console.log(`📨 Iniciando envío de correo a: ${opcionesEmail.to}`);
  
  try {
    // Intento 1: Brevo
    console.log("🚀 Intentando enviar con Brevo (Puerto 587)...");
    const info = await transportBrevo.sendMail(opcionesEmail);
    console.log("✅ Correo enviado con Brevo ID:", info.messageId);
    return info;

  } catch (error) {
    console.error(`⚠️ Falló Brevo: ${error.message} (Code: ${error.code})`);
    console.log("🔄 Cambiando a servidor de respaldo (Gmail Puerto 465)...");

    try {
      // Intento 2: Gmail (Respaldo)
      const infoBackup = await transportGmail.sendMail(opcionesEmail);
      console.log("✅ Correo enviado con Gmail (Respaldo) ID:", infoBackup.messageId);
      return infoBackup;

    } catch (errorBackup) {
      console.error("❌ Fallaron ambos servidores de correo.");
      console.error(`Error Gmail: ${errorBackup.message} (Code: ${errorBackup.code})`);
      throw new Error("No se pudo enviar el email por ningún medio. Verifique conexión saliente.");
    }
  }
};

export const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;

  // Determinar la URL del frontend basada en el entorno
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? process.env.URL_FRONTEND_PROD 
    : process.env.URL_FRONTEND_LOCAL;

  console.log(`🔗 Link generado: ${frontendUrl}/confirmar/${token}`);

  await enviarCorreoHibrido({
    from: '"Agreenbyte - Administrador" <avproject049@gmail.com>',
    to: email,
    subject: "Agreenbyte - Comprueba tu cuenta",
    text: "Comprueba tu cuenta en Agreenbyte",
    html: `
      <p>Hola: ${nombre}, has creado tu cuenta en Agreenbyte.</p>
      <p>Tu cuenta ya está casi lista, solo debes comprobarla en el siguiente enlace:</p>
      <a href="${frontendUrl}/confirmar/${token}">Comprobar Cuenta</a>
      <p>Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>
    `
  });
};

export const emailOlvidePassword = async (datos) => {
  const { email, nombre, token, rol } = datos;

  // Determinar la URL del frontend basada en el entorno
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? process.env.URL_FRONTEND_PROD 
    : process.env.URL_FRONTEND_LOCAL;

  // Construimos la URL con el parámetro 'rol' si existe
  const enlace = rol 
    ? `${frontendUrl}/olvide-password/${token}?rol=${rol}`
    : `${frontendUrl}/olvide-password/${token}`;

  console.log(`🔗 Link recuperación generado: ${enlace}`);

  await enviarCorreoHibrido({
    from: '"Agreenbyte - Administrador" <avproject049@gmail.com>',
    to: email,
    subject: "Agreenbyte - Reestablece tu Password",
    text: "Reestablece tu Password",
    html: `
      <p>Hola: ${nombre}, has solicitado reestablecer tu password.</p>
      <p>Sigue el siguiente enlace para generar un nuevo password:</p>
      <a href="${enlace}">Reestablecer Password</a>
      <p>Si tú no solicitaste este email, puedes ignorar este mensaje.</p>
    `
  });
};