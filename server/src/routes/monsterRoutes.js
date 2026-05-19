import { Router } from "express";
import {
    checkName,
    listMonsters,
    getMonster,
    createMonster,
    updateMonster,
    deleteMonster,
    cloneMonster,
    uploadMonsterImage,
    deleteMonsterImage
} from "../controllers/monsterController.js";
import { authRequired } from "../middlewares/authRequired.js";
import { dmRequired } from "../middlewares/dmRequired.js";
import { avatarUpload } from "../config/upload.js";
import { validateBody, validateObjectId} from "../middlewares/validateBody.js";

const router = Router();

// Todas las rutas del bestiario requieren autenticación + capacidad DM
router.use(authRequired);
router.use(dmRequired);

router.get("/check-name", checkName);
router.get("/", listMonsters);
router.get("/:id", validateObjectId(), getMonster);
router.post("/", validateBody(["name"]), createMonster);
router.post("/:id/clone", validateObjectId(), cloneMonster);
router.post("/:id/image", validateObjectId(), avatarUpload.single("image"), uploadMonsterImage);
router.delete("/:id/image", validateObjectId(), deleteMonsterImage);
router.put("/:id", validateObjectId(), updateMonster);
router.delete("/:id", validateObjectId(), deleteMonster);

export default router;