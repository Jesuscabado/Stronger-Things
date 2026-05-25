import { Router } from "express";
import {
    listSessions,
    getSession,
    createSession,
    updateSession,
    deleteSession,
    addParticipant,
    removeParticipant
} from "../controllers/sessionController.js";
import { authRequired } from "../middlewares/authRequired.js";
import { dmRequired } from "../middlewares/dmRequired.js";
import { validateBody, validateObjectId } from "../middlewares/validateBody.js";

const router = Router();

router.use(authRequired);
router.use(dmRequired);

router.get("/", listSessions);
router.post("/", validateBody(["name"]), createSession);
router.get("/:id", validateObjectId(), getSession);
router.put("/:id", validateObjectId(), updateSession);
router.delete("/:id", validateObjectId(), deleteSession);

router.post("/:id/participants", validateObjectId(), addParticipant);
router.delete("/:id/participants/:characterId", validateObjectId(), validateObjectId("characterId"), removeParticipant);

export default router;
