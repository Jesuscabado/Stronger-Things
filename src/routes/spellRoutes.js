import { Router } from "express";
import * as spellController from "../controllers/spellController.js";
import { authRequired } from "../middlewares/authRequired.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authRequired);

router.get("/", spellController.list);
router.get("/:id", spellController.getOne);
router.post("/", spellController.create);
router.delete("/:id", spellController.remove);

export default router;
