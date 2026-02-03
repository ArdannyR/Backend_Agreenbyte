import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const administradorSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    telefono: {
        type: String,
        default: null,
        trim: true
    },
    direccion: {
        type: String,
        default: null,
        trim: true
    },
    token: {
      type: String,
      default: ''
    },
    tokenExpires: {
        type: Date,
        default: null
    },
    confirmado: {
      type: Boolean,
      default: false,
    },
    google: {
        type: Boolean,
        default: false
    }
  },
  {
    timestamps: true,
  }
);

administradorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

administradorSchema.methods.comprobarPassword = async function (passwordFormulario) {
  return await bcrypt.compare(passwordFormulario, this.password);
};

const Administrador = mongoose.model('Administrador', administradorSchema);
export default Administrador;