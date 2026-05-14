import { Router } from "express";
import {
    listMonsters,
    getMonster,
    createMonster,
    updateMonster,
    deleteMonster
} from "../controllers/monsterController.js";
import { authRequired } from "../middlewares/authRequired.js";
import { dmRequired } from "../middlewares/dmRequired.js";

import { validateBody, validateObjectId} from "../middlewares/validateBody.js";

const router = Router();

// Todas las rutas del bestiario requieren autenticación + capacidad DM
router.use(authRequired);
router.use(dmRequired);

router.get("/", listMonsters);
router.get("/:id", validateObjectId(), getMonster);
router.post("/", validateBody(["name"]), createMonster);
router.put("/:id", validateObjectId(), updateMonster);
router.delete("/:id", validateObjectId(), deleteMonster);

export default router;