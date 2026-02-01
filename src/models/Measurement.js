import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now // Timestamp automático si el sensor no lo envía
    },
    value: {
        type: Number,
        required: true
    },
    // La metadata en Time Series debe ser datos que identifiquen la serie única
    metadata: {
        sensor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sensor',
            required: true
        },
        type: { type: String, required: true }, // Ej: 'Temperatura', 'Humedad'
        tenant_id: { type: String, required: true }
    }
}, {
    // CONFIGURACIÓN CRÍTICA PARA TIME SERIES
    timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'minutes' // 'seconds', 'minutes' o 'hours' dependiendo de la frecuencia de envío
    },
    // Expiración automática (opcional): Borra datos viejos después de 1 año para ahorrar espacio
    expireAfterSeconds: 31536000 
});

const Measurement = mongoose.model('Measurement', measurementSchema);
export default Measurement;