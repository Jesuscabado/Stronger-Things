import { Router } from "express";
import { characterSheetUpload, avatarUpload } from "../config/upload.js";
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
    deleteCharacterSheet,
    uploadAvatar,
    deleteAvatar,
    addSpellToCharacter,
    updateCharacterSpell,
    removeCharacterSpell,
    addDiaryEntryToCharacter,
    updateCharacterDiaryEntry,
    removeCharacterDiaryEntry
} from "../controllers/characterController.js";
import { validateBody, validateObjectId } from "../middlewares/validateBody.js";
import { authRequired } from "../middlewares/authRequired.js";

const router = Router();

router.use(authRequired);

// CRUD del personaje
router.get("/", getAllCharacters);
router.post("/", validateBody(["name", "charClass"]), createCharacter);
router.get("/:id", validateObjectId(), getCharacterById);
router.put("/:id", validateObjectId(), updateCharacter);
router.delete("/:id", validateObjectId(), deleteCharacter);

// Inventario
router.post("/:id/inventory", validateObjectId(), validateBody(["baseObject"]), addItemToInventory);
router.put("/:id/inventory/:itemId", validateObjectId(), validateObjectId("itemId"), updateInventoryItem);
router.delete("/:id/inventory/:itemId", validateObjectId(), validateObjectId("itemId"), removeInventoryItem);

// Hoja de personaje (PDF)
router.post("/:id/sheet", validateObjectId(), characterSheetUpload.single("sheet"), uploadCharacterSheet);
router.get("/:id/sheet", validateObjectId(), downloadCharacterSheet);
router.delete("/:id/sheet", validateObjectId(), deleteCharacterSheet);

// Avatar (imagen)
router.post("/:id/avatar", validateObjectId(), avatarUpload.single("avatar"), uploadAvatar);
router.delete("/:id/avatar", validateObjectId(), deleteAvatar);
router.post("/:id/spells", validateObjectId(),addSpellToCharacter);
router.patch("/:id/spells/:spellId", validateObjectId(),updateCharacterSpell);
router.delete("/:id/spells/:spellId", validateObjectId(),removeCharacterSpell);

// Diario del personaje
router.post("/:id/diary",validateObjectId(),validateBody(["content"]),addDiaryEntryToCharacter);
router.put(
"/:id/diary/:entryId",validateObjectId(),validateObjectId("entryId"),updateCharacterDiaryEntry);
router.delete("/:id/diary/:entryId",validateObjectId(),validateObjectId("entryId"),removeCharacterDiaryEntry);

export default router;
