# Agreenbyte
imagen aqui

## 👨‍💻 El Equipo

* **Brandon Huera**
    * *Scrum Master*
    * *Desarrollo Móvil (Componente futuro)*

* **Juan Lucero**
    * *Desarrollo Frontend*

* **Ardanny Romero**
    * *Desarrollo Backend*

 ---

## 🛠️ Tecnologías Utilizadas

### Backend
* **Framework:** Node.js con Express
* **Base de Datos:** MongoDB (a través de Mongoose)
* **Autenticación:** JSON Web Tokens (JWT) y Bcrypt
* **Envío de Emails:** Nodemailer (configurado para Mailtrap)
* **Variables de Entorno:** `dotenv`
* **Herramientas de Desarrollo:** `nodemon`

---

## 🗺️ Endpoints Disponibles

Todos los endpoints están bajo el prefijo `/api/agricultores`.
Para mayor documentacion sobre los encpoints visite: https://documenter.getpostman.com/view/49837760/2sB3dLVXVK

### Autenticación y Cuentas (Área Pública)
* `POST /`
    * **Acción:** Registra un nuevo agricultor.
    * **Body:** `{ nombre, email, password }`
* `GET /confirmar/:token`
    * **Acción:** Confirma la cuenta de un usuario a través del token enviado por email.
* `POST /login`
    * **Acción:** Autentica a un usuario y retorna un JWT.
    * **Body:** `{ email, password }`
* `POST /olvide-password`
    * **Acción:** Inicia el proceso de reseteo de contraseña. Envía un email con un token.
    * **Body:** `{ email }`
* `GET /olvide-password/:token`
    * **Acción:** Comprueba si un token de reseteo es válido y no ha expirado.
* `POST /olvide-password/:token`
    * **Acción:** Establece la nueva contraseña para el usuario asociado al token.
    * **Body:** `{ password }`

### Perfil (Área Privada - Requiere JWT)
* `GET /perfil`
    * **Acción:** Obtiene la información del perfil del agricultor autenticado (Ruta protegida por `checkAuth`).
* `PUT /perfil`
    * **Acción:** Actualiza la información del perfil (nombre o email) del agricultor autenticado.
    * **Body:** `{ nombre, email }` (Campos opcionales; se actualizan solo los enviados).

