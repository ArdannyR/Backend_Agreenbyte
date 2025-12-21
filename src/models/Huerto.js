import mongoose from 'mongoose';

const huertoSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    tipoCultivo: {
      type: String,
      required: true,
      trim: true,
    },
    ubicacion: {
      type: String,
      trim: true,
      default: ''
    },
    codigoDispositivo: {
      type: String,
      required: true,     
      unique: true,       //No pueden haber dos huertos con el mismo chip
      trim: true
    },
    // Datos de sensores
    temperatura: { 
      type: Number, 
      default: 0 
    },
    humedad: { 
      type: Number, 
      default: 0 
    },
    // Sugerencia: Fecha en que se sembró para calcular tiempos de cosecha
    fechaSiembra: {
      type: Date,
      default: Date.now
    },
    // Relación: Un huerto pertenece a un Agricultor
    agricultor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agricultor',
      required: true
    }
  },
  {
    timestamps: true, // Crea createdAt y updatedAt automáticamente
  }
);

const Huerto = mongoose.model('Huerto', huertoSchema);
export default Huerto;