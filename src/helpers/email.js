import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import nodemailer from 'nodemailer';
import * as sibApiV3Sdk from '@getbrevo/brevo';
import dotenv from 'dotenv';
dotenv.config();

// Inicialización de MailerSend (Se queda como respaldo)
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// Configuración de Gmail (AHORA ES LA PRIORIDAD)
const crearTransporteGmail = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Puerto seguro recomendado para Gmail
    secure: true, 
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // OJO: Debe ser una "Contraseña de Aplicación", no tu clave normal
    },
    // tls: { rejectUnauthorized: false } // Generalmente no es necesario si usas secure: true, pero puedes descomentarlo si falla
  });
};

// Configuración de Brevo (Se queda como respaldo)
const apiInstance = new sibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(sibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_SMTP_KEY);

const enviarEmailHibrido = async (datos) => {
  const { email, nombre, asunto, mensajeHtml } = datos;

  // 1. INTENTO CON GMAIL (Prioridad para pruebas sin dominio propio)
  try {
    console.log(`--- Intentando enviar vía GMAIL a: ${email} ---`);
    
    const transport = crearTransporteGmail();
    const infoGmail = await transport.sendMail({
      from: `"Agreenbyte 🌿" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: asunto,
      html: mensajeHtml,
    });
    
    console.log(`✅ Enviado con GMAIL. ID: ${infoGmail.messageId}`);
    return infoGmail;

  } catch (errorGmail) {
    // 2. SI GMAIL FALLA, INTENTAMOS LOS OTROS (Respaldos)
    console.warn(`⚠️ GMAIL falló: ${errorGmail.message}. Intentando respaldos...`);

    try {
      // INTENTO CON MAILERSEND
      // Recuerda: Esto solo funcionará si verificas el dominio en MailerSend
      const senderEmail = "TU_CORREO_TRIAL_AQUI@trial-xxxx.mlsender.net"; // <--- CAMBIA ESTO SI QUIERES USARLO
      const sentFrom = new Sender(senderEmail, "Agreenbyte 🌿");
      const recipients = [new Recipient(email, nombre)];

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(asunto)
        .setHtml(mensajeHtml);

      const infoMS = await mailerSend.email.send(emailParams);
      console.log(`✅ Enviado con MAILERSEND. ID: ${infoMS.headers['x-message-id']}`);
      return infoMS;

    } catch (errorMailerSend) {
      console.warn(`⚠️ MAILERSEND falló. Intentando con BREVO...`);

      // 3. INTENTO FINAL CON BREVO
      try {
        const sendSmtpEmail = new sibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = asunto;
        sendSmtpEmail.htmlContent = mensajeHtml;
        sendSmtpEmail.sender = { name: "Agreenbyte", email: process.env.BREVO_USER };
        sendSmtpEmail.to = [{ email, name: nombre }];

        const dataBrevo = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Enviado con BREVO. ID: ${dataBrevo.body.messageId}`);
        return dataBrevo;

      } catch (errorBrevo) {
        console.error("❌ TODOS los servicios de correo fallaron.");
        throw new Error("Error crítico: No se pudo enviar el correo por ningún medio.");
      }
    }
  }
};

// --- FUNCIONES EXPORTADAS (Sin cambios) ---

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