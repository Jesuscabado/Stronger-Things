import { Router } from "express";
import {
    getAllCharacters,
    getCharacterById,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    addItemToInventory,
    updateInventoryItem,
    removeInventoryItem,
    uploadCharacterSheet,
    downloadCharacterSheet,
    deleteCharacterSheet
} from "../controllers/characterController.js";
import { validateBody, validateObjectId } from "../middlewares/validateBody.js";
import { authRequired } from "../middlewares/authRequired.js";
import { characterSheetUpload } from "../config/upload.js";

const router = Router();

// Todas las rutas exigen estar logueado
router.use(authRequired);

// CRUD del personaje
router.get("/", getAllCharacters);
router.post("/", validateBody(["name", "charClass"]), createCharacter);
router.get("/:id", validateObjectId(), getCharacterById);
router.put("/:id", validateObjectId(), updateCharacter);
router.delete("/:id", validateObjectId(), deleteCharacter);

// Inventario
router.post(
    "/:id/inventory",
    validateObjectId(),
    validateBody(["baseObject"]),
    addItemToInventory
);
router.put(
    "/:id/inventory/:itemId",
    validateObjectId(),
    validateObjectId("itemId"),
    updateInventoryItem
);
router.delete(
    "/:id/inventory/:itemId",
    validateObjectId(),
    validateObjectId("itemId"),
    removeInventoryItem
);

// Hoja de personaje (PDF)
router.post(
    "/:id/sheet",
    validateObjectId(),
    characterSheetUpload.single("sheet"),
    uploadCharacterSheet
);
router.get("/:id/sheet", validateObjectId(), downloadCharacterSheet);
router.delete("/:id/sheet", validateObjectId(), deleteCharacterSheet);

export default router;