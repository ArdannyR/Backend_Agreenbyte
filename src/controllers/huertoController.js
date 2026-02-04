import Huerto from '../models/Huerto.js';
import Agricultor from '../models/Agricultor.js';

const agregarHuerto = async (req, res) => {
  const huerto = new Huerto(req.body);
  // Asigna el ID del administrador autenticado al huerto
  huerto.administrador = req.administrador._id;

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
  let huertos = [];

  // CASO 1: Petición hecha por el DUEÑO (Administrador)
  if (req.administrador) {
    huertos = await Huerto.find().where('administrador').equals(req.administrador);
  }
  // CASO 2: Petición hecha por el AGRICULTOR
  else if (req.agricultor) {
    // Busca huertos donde mi ID de agricultor esté en la lista permitida
    huertos = await Huerto.find({
      agricultores: { $in: [req.agricultor._id] }
    });
  } else {
    return res.json([]); // Si no es ninguno, retorna vacío
  }

  // === MOCK DATA (DATOS QUEMADOS) ===
  // Si la DB no tiene datos de sensores (son 0 o null), inyectamos valores simulados
  // para que el Dashboard no se vea vacío.
  const huertosSimulados = huertos.map(huertoDoc => {
      const h = huertoDoc.toObject(); // Convertimos a objeto plano JS para poder modificarlo
      
      if (!h.temperatura || h.temperatura === 0) {
          // Generar Temp aleatoria entre 18 y 28
          h.temperatura = (Math.random() * (28 - 18) + 18).toFixed(1); 
      }
      if (!h.humedad || h.humedad === 0) {
          // Generar Humedad aleatoria entre 40 y 80
          h.humedad = Math.floor(Math.random() * (80 - 40) + 40);
      }
      return h;
  });

  return res.json(huertosSimulados);
};

const obtenerHuerto = async (req, res) => {
  const { id } = req.params;

  if(id.match(/^[0-9a-fA-F]{24}$/)) {
    let huerto = await Huerto.findById(id);

    if (!huerto) {
      return res.status(404).json({ msg: 'Huerto no encontrado' });
    }

    // Validación de permisos: Verificar si es el dueño (Administrador)
    if (huerto.administrador.toString() !== req.administrador._id.toString()) {
      return res.status(403).json({ msg: 'Acción no válida (No tienes permisos)' });
    }

    // === MOCK DATA para vista individual ===
    const h = huerto.toObject();
    if (!h.temperatura || h.temperatura === 0) {
        h.temperatura = (Math.random() * (28 - 18) + 18).toFixed(1);
    }
    if (!h.humedad || h.humedad === 0) {
        h.humedad = Math.floor(Math.random() * (80 - 40) + 40);
    }

    res.json(h);
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

    // Validación de permisos
    if (huerto.administrador.toString() !== req.administrador._id.toString()) {
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

    // Validación de permisos
    if (huerto.administrador.toString() !== req.administrador._id.toString()) {
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

  if (req.io) {
      req.io.emit('sensor:data', {
          huertoId: huerto._id,
          codigo: codigoDispositivo,
          temperatura: temperatura,
          humedad: humedad,
          fecha: new Date()
      });
      console.log(`📡 Datos emitidos para ${codigoDispositivo}: T:${temperatura} H:${humedad}`);
  }

  res.json({ msg: 'Datos actualizados correctamente' });
};

const agregarAgricultor = async (req, res) => {
  const { id } = req.params; // ID del Huerto
  const { email } = req.body; // Email del Agricultor a vincular

  // 1. Verificar que el huerto existe
  const huerto = await Huerto.findById(id);
  if (!huerto) {
    return res.status(404).json({ msg: 'Huerto no encontrado' });
  }

  // 2. Verificar que quien hace la petición es el DUEÑO (Administrador)
  if (huerto.administrador.toString() !== req.administrador._id.toString()) {
    return res.status(403).json({ msg: 'Acción no válida: No eres el dueño de este huerto' });
  }

  // 3. Buscar si el Agricultor existe en la base de datos
  const agricultor = await Agricultor.findOne({ email });
  if (!agricultor) {
    return res.status(404).json({ msg: 'Usuario no encontrado. El agricultor debe registrarse primero.' });
  }

  // 4. Verificar si ya estaba agregado
  if (huerto.agricultores.includes(agricultor._id)) {
    return res.status(400).json({ msg: 'El agricultor ya está agregado a este huerto' });
  }

  // 5. Agregarlo y guardar
  huerto.agricultores.push(agricultor._id);
  await huerto.save();

  res.json({ msg: 'Agricultor agregado correctamente' });
};

const eliminarAgricultorDeHuerto = async (req, res) => {
    const { id } = req.params; // ID del Huerto
    const { agricultorId } = req.body; // ID del Agricultor a desvincular

    const huerto = await Huerto.findById(id);
    if (!huerto) {
        return res.status(404).json({ msg: 'Huerto no encontrado' });
    }

    if (huerto.administrador.toString() !== req.administrador._id.toString()) {
        return res.status(403).json({ msg: 'Acción no válida: No eres el dueño' });
    }

    // Filtramos el array para excluir el ID del agricultor
    huerto.agricultores = huerto.agricultores.filter(
        agricultor => agricultor.toString() !== agricultorId
    );

    await huerto.save();
    res.json({ msg: 'Agricultor desvinculado correctamente' });
};

export {
  agregarHuerto,
  obtenerHuertos,
  obtenerHuerto,
  actualizarHuerto,
  eliminarHuerto,
  actualizarDatosSensores,
  agregarAgricultor,
  eliminarAgricultorDeHuerto
};