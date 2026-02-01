import mongoose from 'mongoose';

const sensorSchema = mongoose.Schema({
    // Identificador físico único (MAC address o ID quemado en el ESP32)
    // Esto coincide con tu 'codigoDispositivo' en el .ino
    codigoDispositivo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true // Ej: "Sensor Humedad Zona Norte"
    },
    type: {
        type: String,
        required: true,
        enum: ['DHT11', 'DHT22', 'BMP280', 'FC-28'] // Estandariza los tipos
    },
    // Relación con tu modelo existente de Huerto
    huerto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Huerto',
        required: true
    },
    zone: {
        type: String,
        default: 'General' // Ej: 'Semilleros', 'Hidroponía'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    },
    // Preparación Multi-tenant (SaaS)
    tenant_id: {
        type: String, // Podría ser el ID del Administrador dueño del huerto
        required: true,
        index: true
    },
    // Configuración de alertas (guardado aquí, no en cada medición)
    thresholds: {
        min: { type: Number, default: null },
        max: { type: Number, default: null }
    }
}, {
    timestamps: true
});

const Sensor = mongoose.model('Sensor', sensorSchema);
export default Sensor;