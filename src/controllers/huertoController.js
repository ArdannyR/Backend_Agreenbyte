import Huerto from '../models/Huerto.js';

const agregarHuerto = async (req, res) => {
  const huerto = new Huerto(req.body);
  
  // Asignar el agricultor autenticado al huerto (req.agricultor viene del checkAuth)
  huerto.agricultor = req.agricultor._id;

  try {
    const huertoAlmacenado = await huerto.save();
    res.json(huertoAlmacenado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Hubo un error al guardar el huerto' });
  }
};

const obtenerHuertos = async (req, res) => {
  // Obtener solo los huertos del agricultor autenticado
  const huertos = await Huerto.find().where('agricultor').equals(req.agricultor);
  res.json(huertos);
};

const obtenerHuerto = async (req, res) => {
  const { id } = req.params;

  // Validar que sea un ID válido de MongoDB
  if(id.match(/^[0-9a-fA-F]{24}$/)) {
    const huerto = await Huerto.findById(id);

    if (!huerto) {
      return res.status(404).json({ msg: 'Huerto no encontrado' });
    }

    // Validar que el huerto pertenezca al usuario autenticado
    if (huerto.agricultor.toString() !== req.agricultor._id.toString()) {
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

    if (huerto.agricultor.toString() !== req.agricultor._id.toString()) {
      return res.status(403).json({ msg: 'Acción no válida' });
    }

    // Actualizar campos
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

    if (huerto.agricultor.toString() !== req.agricultor._id.toString()) {
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

export {
  agregarHuerto,
  obtenerHuertos,
  obtenerHuerto,
  actualizarHuerto,
  eliminarHuerto
};