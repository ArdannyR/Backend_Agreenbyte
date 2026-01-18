import Huerto from '../models/Huerto.js';

const agregarHuerto = async (req, res) => {
  const huerto = new Huerto(req.body);
  // Cambiado req.agricultor -> req.desarrollador
  huerto.desarrollador = req.desarrollador._id;

  try {
    const huertoAlmacenado = await huerto.save();
    res.json(huertoAlmacenado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'Ese dispositivo ya está registrado en otro huerto' });
    }
    console.log(error);
    res.status(500).json({ msg: 'Hubo un error al guardar el huerto' });
  }
};

const obtenerHuertos = async (req, res) => {
  // Cambiado .where('agricultor').equals(req.agricultor) -> .where('desarrollador').equals(req.desarrollador)
  const huertos = await Huerto.find().where('desarrollador').equals(req.desarrollador);
  res.json(huertos);
};

const obtenerHuerto = async (req, res) => {
  const { id } = req.params;

  if(id.match(/^[0-9a-fA-F]{24}$/)) {
    const huerto = await Huerto.findById(id);

    if (!huerto) {
      return res.status(404).json({ msg: 'Huerto no encontrado' });
    }

    // Validación de permisos actualizada
    if (huerto.desarrollador.toString() !== req.desarrollador._id.toString()) {
      return res.status(403).json({ msg: 'Acción no válida (No tienes permisos)' });
    }

    res.json(huerto);
  } else {
    return res.status(404).json({ msg: 'ID no válido' });
  }
};

const actualizarHuerto = async (req, res) => {
  const { id } = req.params;

  if(id.match(/^[0-9a-fA-F]{24}$/)) {
    const huerto = await Huerto.findById(id);

    if (!huerto) {
      return res.status(404).json({ msg: 'Huerto no encontrado' });
    }

    // Validación de permisos actualizada
    if (huerto.desarrollador.toString() !== req.desarrollador._id.toString()) {
      return res.status(403).json({ msg: 'Acción no válida' });
    }

    huerto.nombre = req.body.nombre || huerto.nombre;
    huerto.tipoCultivo = req.body.tipoCultivo || huerto.tipoCultivo;
    huerto.ubicacion = req.body.ubicacion || huerto.ubicacion;
    huerto.temperatura = req.body.temperatura || huerto.temperatura;
    huerto.humedad = req.body.humedad || huerto.humedad;
    huerto.fechaSiembra = req.body.fechaSiembra || huerto.fechaSiembra;

    try {
      const huertoActualizado = await huerto.save();
      res.json(huertoActualizado);
    } catch (error) {
      console.log(error);
    }
  } else {
    return res.status(404).json({ msg: 'ID no válido' });
  }
};

const eliminarHuerto = async (req, res) => {
  const { id } = req.params;

  if(id.match(/^[0-9a-fA-F]{24}$/)) {
    const huerto = await Huerto.findById(id);

    if (!huerto) {
      return res.status(404).json({ msg: 'Huerto no encontrado' });
    }

    // Validación de permisos actualizada
    if (huerto.desarrollador.toString() !== req.desarrollador._id.toString()) {
      return res.status(403).json({ msg: 'Acción no válida' });
    }

    try {
      await huerto.deleteOne();
      res.json({ msg: 'Huerto Eliminado' });
    } catch (error) {
      console.log(error);
    }
  } else {
    return res.status(404).json({ msg: 'ID no válido' });
  }
};

const actualizarDatosSensores = async (req, res) => {
  const { codigoDispositivo, temperatura, humedad } = req.body;

  const huerto = await Huerto.findOne({ codigoDispositivo });

  if (!huerto) {
    return res.status(404).json({ msg: 'Dispositivo no encontrado' });
  }

  huerto.temperatura = temperatura;
  huerto.humedad = humedad;
  await huerto.save();

  res.json({ msg: 'Datos actualizados correctamente' });
};

export {
  agregarHuerto,
  obtenerHuertos,
  obtenerHuerto,
  actualizarHuerto,
  eliminarHuerto,
  actualizarDatosSensores
};