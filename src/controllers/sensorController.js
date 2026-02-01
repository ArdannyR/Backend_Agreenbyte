import Sensor from '../models/Sensor.js';
import Measurement from '../models/Measurement.js';
import Huerto from '../models/Huerto.js';

// --- INGESTA DE DATOS (Simulación Arduino/ESP32) ---
// Endpoint: POST /api/sensores/data
const addMeasurement = async (req, res) => {
    // 1. Recibimos el payload. 
    // Nota: Adaptado para recibir un array de métricas o una sola, flexible para el ESP32.
    // Ejemplo body: { codigoDispositivo: "SENSOR-ESP32-001", temperatura: 24.5, humedad: 60.2 }
    const { codigoDispositivo, temperatura, humedad } = req.body;

    try {
        // 2. Validación de Existencia (Security Layer)
        // Buscamos el sensor en nuestro "Inventario"
        const sensor = await Sensor.findOne({ codigoDispositivo });

        if (!sensor) {
            return res.status(404).json({ msg: 'Sensor no registrado en el sistema' });
        }

        // 3. Preparación de Multi-tenant ID (Hardcodeado por ahora como pediste, o heredado del sensor)
        const currentTenant = sensor.tenant_id || "TENANT_DEFAULT_001";

        // 4. Creación de las métricas (Time Series)
        // Insertamos dos documentos: uno para temperatura y otro para humedad.
        // Esto permite escalar tipos de sensores sin cambiar el esquema de base de datos.
        const measurements = [];

        if (temperatura !== undefined) {
            measurements.push({
                timestamp: new Date(),
                value: temperatura,
                metadata: {
                    sensor_id: sensor._id,
                    type: 'temperatura',
                    tenant_id: currentTenant
                }
            });
        }

        if (humedad !== undefined) {
            measurements.push({
                timestamp: new Date(),
                value: humedad,
                metadata: {
                    sensor_id: sensor._id,
                    type: 'humedad',
                    tenant_id: currentTenant
                }
            });
        }

        // Guardado masivo eficiente
        await Measurement.insertMany(measurements);

        // 5. (Opcional) Actualizar "caché" en el modelo Huerto para visualización rápida en tarjetas
        // Esto mantiene compatibilidad con tu vista actual de tarjetas de huertos.
        await Huerto.findByIdAndUpdate(sensor.huerto, {
            temperatura: temperatura,
            humedad: humedad
        });

        // 6. Emitir Socket.io (Mantenemos tu funcionalidad de tiempo real)
        if (req.io) {
            req.io.emit('sensor:data', {
                huertoId: sensor.huerto,
                codigo: codigoDispositivo,
                temperatura,
                humedad,
                timestamp: new Date()
            });
        }

        res.status(201).json({ msg: 'Métricas guardadas correctamente' });

    } catch (error) {
        console.error("Error en ingesta IoT:", error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
};

// --- CONSULTA PARA DASHBOARD (Aggregation Framework) ---
// Endpoint: GET /api/sensores/stats/:sensorId
const getSensorStats = async (req, res) => {
    const { sensorId } = req.params;
    const { type, rango } = req.query; // type: 'temperatura' | 'humedad', rango: '24h' | '7d'

    // Definir ventana de tiempo
    let startDate = new Date();
    if (rango === '7d') startDate.setDate(startDate.getDate() - 7);
    else startDate.setHours(startDate.getHours() - 24); // Default 24h

    try {
        const stats = await Measurement.aggregate([
            // ETAPA 1: Filtrado ($match)
            // Aprovecha el índice clustered de Time Series para ser ultra-rápido
            {
                $match: {
                    "metadata.sensor_id": new mongoose.Types.ObjectId(sensorId),
                    "metadata.type": type || 'temperatura', // Default a temperatura
                    timestamp: { $gte: startDate }
                }
            },
            // ETAPA 2: Agrupamiento temporal ($group + $dateTrunc)
            // Aquí ocurre el "Downsampling". Convertimos miles de puntos en 1 punto por hora.
            {
                $group: {
                    _id: {
                        $dateTrunc: {
                            date: "$timestamp",
                            unit: "hour", // Agrupar por hora (cambiar a 'day' si el rango es muy amplio)
                            timezone: "America/Guayaquil" // Ajusta a tu zona horaria
                        }
                    },
                    // Calculamos estadísticas clave
                    avgValue: { $avg: "$value" },
                    minValue: { $min: "$value" },
                    maxValue: { $max: "$value" },
                    count: { $sum: 1 } // Útil para saber si hubo desconexiones (pocos datos en la hora)
                }
            },
            // ETAPA 3: Ordenamiento ($sort)
            // Necesario para que la gráfica en React se dibuje de izquierda a derecha
            { $sort: { _id: 1 } },
            // ETAPA 4: Proyección ($project)
            // Formateamos la salida para que sea fácil de consumir por Recharts/Chart.js
            {
                $project: {
                    _id: 0,
                    fecha: "$_id",
                    valor: { $round: ["$avgValue", 2] }, // Redondear a 2 decimales
                    min: "$minValue",
                    max: "$maxValue"
                }
            }
        ]);

        res.json(stats);

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error obteniendo estadísticas' });
    }
};

export { addMeasurement, getSensorStats };