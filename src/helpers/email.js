import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURACIÓN PARA API BREVO (HTTP - PUERTO 443) ---
// Documentación: https://developers.brevo.com/reference/sendtransacemail

const enviarEmailBrevo = async (datos) => {
  const { email, nombre, asunto, mensajeHtml } = datos;
  
  const apiKey = process.env.BREVO_SMTP_KEY; 
  const url = 'https://api.brevo.com/v3/smtp/email';

  if (!apiKey) {
      console.error("❌ ERROR CRÍTICO: Falta BREVO_SMTP_KEY.");
      throw new Error("Configuración de correo faltante.");
  }

  // Cuerpo de la petición según la API v3 de Brevo
  const body = {
    sender: {
      name: "Agreenbyte",
      email: process.env.BREVO_USER // Debe ser un email validado en Brevo
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
    console.log(`🚀 [API] Iniciando envío a ${email}...`);
    
    // Usamos fetch con un timeout manual
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error API Brevo (${response.status}):`, errorText);
      throw new Error(`Fallo Brevo API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Email enviado exitosamente. MessageID: ${data.messageId}`);
    return data;

  } catch (error) {
    console.error("❌ Excepción al enviar email:", error.message);
    throw error; 
  }
};

export const emailRegistro = async (datos) => {
  const { email, nombre, token } = datos;

  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? process.env.URL_FRONTEND_PROD 
    : process.env.URL_FRONTEND_LOCAL;

  // Fallback de seguridad
  const finalUrl = frontendUrl || 'https://agreenbyte.netlify.app';

  console.log(`🔗 Link Registro: ${finalUrl}/confirmar/${token}`);

  await enviarEmailBrevo({
    email,
    nombre,
    asunto: "Agreenbyte - Comprueba tu cuenta",
    mensajeHtml: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #16a34a;">¡Hola ${nombre}!</h2>
        <p>Has creado tu cuenta en Agreenbyte. Ya casi está lista.</p>
        <p>Solo debes comprobarla en el siguiente enlace:</p>
        <a href="${finalUrl}/confirmar/${token}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Comprobar Cuenta</a>
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

  const finalUrl = frontendUrl || 'https://agreenbyte.netlify.app';

  const enlace = rol 
    ? `${finalUrl}/olvide-password/${token}?rol=${rol}`
    : `${finalUrl}/olvide-password/${token}`;

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