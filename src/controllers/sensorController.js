import Sensor from '../models/Sensor.js';
import Measurement from '../models/Measurement.js';
import Huerto from '../models/Huerto.js';
import mongoose from 'mongoose';


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
            console.log("Emitiendo datos al socket para el huerto:", sensor.huerto);
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

const getSensorStats = async (req, res) => {
    const sensorId = req.params.sensorId.trim(); 
    const { type, rango } = req.query;

    if (!mongoose.Types.ObjectId.isValid(sensorId)) {
        return res.status(400).json({ msg: 'El ID del sensor no es válido' });
    }

    let startDate = new Date();
    if (rango === '7d') startDate.setDate(startDate.getDate() - 7);
    else startDate.setHours(startDate.getHours() - 24);

    try {
        const stats = await Measurement.aggregate([
            {
                $match: {
                    // Ahora usamos el ID validado
                    "metadata.sensor_id": new mongoose.Types.ObjectId(sensorId),
                    "metadata.type": type || 'temperatura',
                    timestamp: { $gte: startDate }
                }
            },
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
            { $sort: { _id: 1 } },
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

const registrarSensor = async (req, res) => {
    try {
        const sensor = new Sensor(req.body);
        const sensorAlmacenado = await sensor.save();
        res.status(201).json(sensorAlmacenado);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: 'Este código de dispositivo ya existe' });
        }
        res.status(500).json({ msg: 'Error al registrar el sensor' });
    }
};

export { 
    addMeasurement, 
    getSensorStats, 
    registrarSensor 
};