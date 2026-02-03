import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURACIÓN PARA API BREVO (HTTP) ---
// Usamos la API REST en lugar de SMTP para evitar bloqueos de puertos en Render/Cloud.

const enviarEmailBrevo = async (datos) => {
  const { email, nombre, asunto, mensajeHtml } = datos;
  
  const apiKey = process.env.BREVO_SMTP_KEY; // Tu API Key de Brevo
  const url = 'https://api.brevo.com/v3/smtp/email';

  const body = {
    sender: {
      name: "Agreenbyte - Administrador",
      email: process.env.BREVO_USER // Tu email verificado en Brevo
    },
    to: [
      {
        email: email,
        name: nombre
      }
    ],
    subject: asunto,
    htmlContent: mensajeHtml
  };

  try {
    console.log(`🚀 Enviando email a ${email} vía API Brevo...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error API Brevo: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(`✅ Email enviado correctamente. ID: ${data.messageId}`);
    return data;

  } catch (error) {
    console.error("❌ Error enviando email:", error.message);
    // Si falla, podrías intentar un fallback aquí, pero la API es muy estable.
    throw error;
  }
};

export const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;

  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? process.env.URL_FRONTEND_PROD 
    : process.env.URL_FRONTEND_LOCAL;

  console.log(`🔗 Link Registro: ${frontendUrl}/confirmar/${token}`);

  await enviarEmailBrevo({
    email,
    nombre,
    asunto: "Agreenbyte - Comprueba tu cuenta",
    mensajeHtml: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #16a34a;">¡Hola ${nombre}!</h2>
        <p>Has creado tu cuenta en Agreenbyte. Ya casi está lista.</p>
        <p>Solo debes comprobarla en el siguiente enlace:</p>
        <a href="${frontendUrl}/confirmar/${token}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Comprobar Cuenta</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>
      </div>
    `
  });
};

export const emailOlvidePassword = async (datos) => {
  const { email, nombre, token, rol } = datos;

  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? process.env.URL_FRONTEND_PROD 
    : process.env.URL_FRONTEND_LOCAL;

  const enlace = rol 
    ? `${frontendUrl}/olvide-password/${token}?rol=${rol}`
    : `${frontendUrl}/olvide-password/${token}`;

  console.log(`🔗 Link Recuperación: ${enlace}`);

  await enviarEmailBrevo({
    email,
    nombre,
    asunto: "Agreenbyte - Reestablece tu Password",
    mensajeHtml: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #16a34a;">Hola ${nombre},</h2>
        <p>Has solicitado reestablecer tu password.</p>
        <p>Sigue el siguiente enlace para generar uno nuevo:</p>
        <a href="${enlace}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Reestablecer Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Si tú no solicitaste este email, ignora este mensaje.</p>
      </div>
    `
  });
};