import nodemailer from 'nodemailer';
import * as sibApiV3Sdk from '@getbrevo/brevo';
import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURACIÓN DE GMAIL (Principal) ---
const crearTransporteGmail = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: process.env.GMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Soluciona el error de certificado self-signed
    }
  });
};

// --- CONFIGURACIÓN DE BREVO (Respaldo) ---
const apiInstance = new sibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(sibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_SMTP_KEY);

/**
 * LÓGICA HÍBRIDA: Intenta Gmail, si falla usa Brevo
 */
const enviarEmailHibrido = async (datos) => {
  const { email, nombre, asunto, mensajeHtml } = datos;

  // 1. INTENTO CON GMAIL
  try {
    console.log(`--- Intentando enviar vía GMAIL a: ${email} ---`);
    const transport = crearTransporteGmail();
    const info = await transport.sendMail({
      from: `"Agreenbyte 🌿" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: asunto,
      html: mensajeHtml,
    });
    console.log(`✅ Enviado con GMAIL. ID: ${info.messageId}`);
    return info;

  } catch (errorGmail) {
    console.warn(`⚠️ GMAIL falló: ${errorGmail.message}. Iniciando respaldo con BREVO...`);

    // 2. RESPALDO CON BREVO
    try {
      const sendSmtpEmail = new sibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = asunto;
      sendSmtpEmail.htmlContent = mensajeHtml;
      sendSmtpEmail.sender = { name: "Agreenbyte", email: process.env.BREVO_USER };
      sendSmtpEmail.to = [{ email, name: nombre }];

      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Enviado con BREVO (Respaldo). ID: ${data.body.messageId}`);
      return data;

    } catch (errorBrevo) {
      console.error("❌ AMBOS servicios fallaron.");
      throw new Error("Error crítico: No se pudo enviar el correo por ningún medio.");
    }
  }
};

// --- FUNCIONES EXPORTADAS PARA TUS CONTROLADORES ---

export const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;
  const finalUrl = process.env.URL_FRONTEND_PROD || 'https://agreenbyte.netlify.app';

  await enviarEmailHibrido({
    email,
    nombre,
    asunto: "Agreenbyte - Comprueba tu cuenta",
    mensajeHtml: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #16a34a;">¡Hola ${nombre}!</h2>
        <p>Confirma tu cuenta en el siguiente enlace:</p>
        <a href="${finalUrl}/confirmar/${token}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Comprobar Cuenta</a>
      </div>
    `
  });
};

export const emailOlvidePassword = async (datos) => {
  const { email, nombre, token, rol } = datos;
  const finalUrl = process.env.URL_FRONTEND_PROD || 'https://agreenbyte.netlify.app';
  const enlace = rol ? `${finalUrl}/olvide-password/${token}?rol=${rol}` : `${finalUrl}/olvide-password/${token}`;

  await enviarEmailHibrido({
    email,
    nombre,
    asunto: "Agreenbyte - Restablece tu Password",
    mensajeHtml: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #16a34a;">Hola ${nombre},</h2>
        <p>Haz clic para generar una nueva contraseña:</p>
        <a href="${enlace}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer Password</a>
      </div>
    `
  });
};