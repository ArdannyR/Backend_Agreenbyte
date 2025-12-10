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
    // Sugerencia: Ubicación física del huerto
    ubicacion: {
      type: String,
      trim: true,
      default: ''
    },
    // Datos de sensores (pueden actualizarse frecuentemente)
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