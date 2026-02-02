# Agreenbyte 🌿
Sistema de gestión y monitoreo inteligente para huertos, conectando administradores y agricultores con tecnología IoT avanzada.

## 👨‍💻 El Equipo
* **Brandon Huera**: Scrum Master / Desarrollo Móvil.
* **Juan Lucero**: Desarrollo Frontend.
* **Ardanny Romero**: Desarrollo Backend.

---

## 🛠️ Tecnologías Utilizadas
### Backend
* **Framework:** Node.js con Express (v5.1.0).
* **Base de Datos:** MongoDB con Mongoose (v8.19.3) utilizando colecciones **Time Series** para métricas.
* **Comunicación en Tiempo Real:** Socket.io para actualización instantánea de sensores.
* **Pasarela de Pagos:** Integración con **Stripe** para planes Pro.
* **Autenticación:** JSON Web Tokens (JWT), Bcrypt y **Google Auth**.
* **Envío de Emails:** Sistema híbrido con Nodemailer (Brevo como principal y Gmail como respaldo).
* **IoT:** Ingesta de datos desde dispositivos ESP32.

---

## 🗺️ Endpoints de la API

### 👤 Administradores (`/api/administradores`)
* `POST /`: Registro de nuevo administrador.
* `POST /login`: Autenticación local (Email y Password).
* `POST /google-login`: **Autenticación con Google Auth** (Recibe el token de Google y retorna JWT del sistema).
* `GET /confirmar/:token`: Confirmación de cuenta mediante enlace de correo.
* `POST /olvide-password`: Solicitar recuperación de contraseña.
* `POST /olvide-password/:token`: Definir nueva contraseña tras recuperación.
* `GET /perfil`: Obtener datos del perfil autenticado (Protegido con Middleware).

### 👨‍🌾 Agricultores (`/api/agricultores`)
* `POST /`: Registro de agricultores.
* `POST /login`: Inicio de sesión para agricultores.
* `GET /perfil`: Información del perfil (Protegido).

### 🏡 Huertos (`/api/huertos`)
* `POST /`: Crear huerto y asignar código de dispositivo.
* `GET /`: Listar huertos (Filtra automáticamente por Administrador o Agricultor asignado).
* `POST /agricultor/:id`: Vincular un agricultor a un huerto mediante correo electrónico.

### 📡 Sensores e IoT (`/api/sensores`)
* `POST /`: Registro de nuevo sensor en el sistema.
* `POST /data`: Ingesta de métricas (Temperatura/Humedad) desde dispositivos ESP32.
* `GET /stats/:sensorId`: Obtener estadísticas agregadas para gráficas (Soporta filtrado por rangos de tiempo).

### 💳 Pagos (`/api/pagos`)
* `POST /crear-sesion`: Genera una sesión de Stripe Checkout para suscripciones a planes avanzados.

---
## 📬 Documentación de Postman
A continuación se detallan los módulos disponibles en la documentación de Postman para la API de **Agreenbyte**:

  ### 👤 Mod - Administrador
    🔗 https://documenter.getpostman.com/view/49837760/2sB3dLVXVK

  ### 👨‍🌾 Mod - Agricultor
    🔗 https://documenter.getpostman.com/view/49837760/2sBXc7K4Ao
  
  ### 🏡 Mod - Huerto
    🔗 https://documenter.getpostman.com/view/49837760/2sBXc7K4Aq
  
  ### 💳 Mod - Pagos
    🔗 https://documenter.getpostman.com/view/49837760/2sBXc7K4At
  
  ### 📡 Mod - Sensor
    🔗 https://documenter.getpostman.com/view/49837760/2sBXc7K4F9
  
  ### 🔐 Autenticación con Google
    🔗 https://documenter.getpostman.com/view/49837760/2sBXc7K4FE

--- 

## 🔌 Integración en Tiempo Real (WebSockets)
La API utiliza **Socket.io** para emitir eventos cada vez que un sensor envía datos, permitiendo actualizaciones en el frontend sin recargar:
* **Evento:** `sensor:data`
* **Payload de ejemplo:**
```json
{
  "huertoId": "65b...",
  "codigo": "ESP32-001",
  "temperatura": 25.4,
  "humedad": 65,
  "timestamp": "2026-02-02T16:00:00Z"
}


