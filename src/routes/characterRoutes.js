import { Router } from "express";
import {
    getAllCharacters,
    getCharacterById,
    createCharacter,
    addItemToInventory
} from "../controllers/characterController.js";
import { validateBody, validateObjectId } from "../middlewares/validateBody.js";

const router = Router();

router.get("/", getAllCharacters);
router.get("/:id", validateObjectId(), getCharacterById);
router.post("/", validateBody(["user", "name", "charClass"]), createCharacter);
router.post(
    "/:id/inventory",
    validateObjectId(),
    validateBody(["baseObject"]),
    addItemToInventory
);

export default router;
