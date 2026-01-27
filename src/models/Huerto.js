import mongoose from 'mongoose';
import Desarrollador from './Administrador.js';

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
      unique: true,       
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
    // Relación: Un huerto lo hace un administrador, el huerto puede ir a muchos agricultores asi como muchos agricultores pueden ver un solo huerto
    administrador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Administrador', 
      required: true
    },
    agricultores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agricultor'
      }
    ]
  },{
    timestamps: true, 
  }
);

const Huerto = mongoose.model('Huerto', huertoSchema);
export default Huerto;