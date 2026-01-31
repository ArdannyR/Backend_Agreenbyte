# Agreenbyte 🌿
Sistema de gestión y monitoreo inteligente para huertos, conectando administradores y agricultores con tecnología IoT.

## 👨‍💻 El Equipo
* **Brandon Huera**: Scrum Master / Desarrollo Móvil (Componente futuro).
* **Juan Lucero**: Desarrollo Frontend.
* **Ardanny Romero**: Desarrollo Backend.

---

## 🛠️ Tecnologías Utilizadas
### Backend
* **Framework:** Node.js con Express (v5.1.0).
* **Base de Datos:** MongoDB con Mongoose (v8.19.3).
* **Autenticación:** JSON Web Tokens (JWT) y Bcrypt para el hash de contraseñas.
* **Envío de Emails:** Sistema híbrido con Nodemailer utilizando Brevo (principal) y Gmail (respaldo).
* **IoT:** Integración con microcontroladores ESP32 para recolección de datos. (Funcionalidad aun en pruebas)
* **Herramientas:** Dotenv para gestión de variables de entorno y Nodemon para desarrollo.

---

## 🗺️ Endpoints de la API

### 👤 Administradores (`/api/administradores`)
Gestión global de la plataforma y usuarios.
* `POST /`: Registra un nuevo administrador.
* `POST /login`: Autentica y genera un token JWT.
* `GET /confirmar/:token`: Confirma la cuenta mediante token de email.
* `POST /olvide-password`: Inicia recuperación de cuenta.
* `GET /perfil`: Obtiene datos del perfil (Requiere `checkAuth`).
* `PUT /perfil`: Actualiza datos personales del administrador.

### 👨‍🌾 Agricultores (`/api/agricultores`)
Área para los usuarios que operan directamente en los huertos.
* `POST /`: Registro de nuevos agricultores.
* `POST /login`: Inicio de sesión para agricultores.
* `GET /perfil`: Información del perfil del agricultor (Protegido).

### 🏡 Huertos (`/api/huertos`)
Control de espacios de cultivo y asignación de personal.
* `POST /`: Crea un nuevo huerto asignando un código de dispositivo IoT.
* `GET /`: Lista los huertos (Dueños ven los suyos; Agricultores ven los asignados).
* `GET /:id`: Detalle completo de un huerto.
* `PUT /:id`: Actualiza parámetros del huerto o umbrales de sensores.
* `DELETE /:id`: Elimina el registro de un huerto.
* `POST /agricultor/:id`: Vincula a un agricultor con un huerto específico mediante su email.

---

## 📡 Integración IoT (Aun en estado de prueba)
El sistema está diseñado para recibir datos automáticos de sensores a través de dispositivos **ESP32**.

* **Endpoint de Sensores:** `POST /api/huertos/actualizar-datos`.
* **Payload esperado de ejemplo:**
```json
{
  "codigoDispositivo": "SENSOR-ESP32-001",
  "temperatura": 24.5,
  "humedad": 60.2
}
