import { Router } from "express";
import {
    getAllBaseObjects,
    getBaseObjectById,
    createBaseObject,
    updateBaseObject,
    deleteBaseObject
} from "../controllers/baseObjectController.js";
import { validateBody, validateObjectId } from "../middlewares/validateBody.js";
import { authRequired } from "../middlewares/authRequired.js";

const router = Router();

// Lectura abierta a cualquiera (catálogo público)
router.get("/", getAllBaseObjects);
router.get("/:id", validateObjectId(), getBaseObjectById);

// Escritura solo para usuarios logueados
router.post("/", authRequired, validateBody(["name"]), createBaseObject);
router.put("/:id", authRequired, validateObjectId(), updateBaseObject);
router.delete("/:id", authRequired, validateObjectId(), deleteBaseObject);

export default router;