import express from "express";
const router = express.Router();
import {
  agregarHuerto,
  obtenerHuertos,
  obtenerHuerto,
  actualizarHuerto,
  eliminarHuerto,
  actualizarDatosSensores,
  agregarAgricultor,
  eliminarAgricultorDeHuerto
} from "../controllers/huertoController.js";
import checkAuth from "../middleware/authMiddleware.js";

router
  .route("/")
  .post(checkAuth, agregarHuerto)
  .get(checkAuth, obtenerHuertos);

router
  .route("/:id")
  .get(checkAuth, obtenerHuerto)
  .put(checkAuth, actualizarHuerto)
  .delete(checkAuth, eliminarHuerto);

router.post("/sensor-data", actualizarDatosSensores);

// Gestión de agricultores en huertos
router.post("/agricultor/:id", checkAuth, agregarAgricultor);
router.put("/remover-agricultor/:id", checkAuth, eliminarAgricultorDeHuerto);

export default router;