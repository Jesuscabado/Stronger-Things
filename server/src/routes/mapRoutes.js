import { Router } from "express";
import {
    listMaps, getMap, createMap, updateMap, deleteMap, generateMap
} from "../controllers/mapController.js";
import { authRequired }              from "../middlewares/authRequired.js";
import { dmRequired }                from "../middlewares/dmRequired.js";
import { validateBody, validateObjectId } from "../middlewares/validateBody.js";

const router = Router();

router.use(authRequired);
router.use(dmRequired);

// POST /generate debe ir antes de /:id para que "generate" no sea capturado
// como un ObjectId (validateObjectId lo rechazaría de todos modos, pero
// es más limpio tener la ruta explícita primero).
router.post("/generate", generateMap);

router.get("/",    listMaps);
router.post("/",   validateBody(["name"]), createMap);
router.get("/:id",    validateObjectId(), getMap);
router.put("/:id",    validateObjectId(), updateMap);
router.delete("/:id", validateObjectId(), deleteMap);

export default router;
